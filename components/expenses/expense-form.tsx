"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Lock, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  CATEGORIES,
  MAX_PHOTOS_PER_EXPENSE,
  MAX_PHOTO_SIZE_MB,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/types";

interface Pending {
  file: File;
  preview: string;
}

export function ExpenseForm() {
  const { t } = useI18n();
  const me = useProfile();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("grocery");
  const [date, setDate] = useState(toDateInput());
  const [photos, setPhotos] = useState<Pending[]>([]);
  const [saving, setSaving] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS_PER_EXPENSE - photos.length;
    if (room <= 0) {
      toast.error(`${t.expenses.max} ${MAX_PHOTOS_PER_EXPENSE} — ${t.expenses.photosReached}`);
      return;
    }
    const next: Pending[] = [];
    Array.from(files)
      .slice(0, room)
      .forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} > ${MAX_PHOTO_SIZE_MB}MB`);
          return;
        }
        next.push({ file, preview: URL.createObjectURL(file) });
      });
    setPhotos((p) => [...p, ...next]);
  }

  function removePhoto(index: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[index].preview);
      return p.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error(t.common.amount + " " + t.common.required);
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add credentials to .env.local — see README.",
      });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      // 1. Create the expense row.
      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          created_by: me.id,
          amount: value,
          description: description.trim() || null,
          category,
          spent_on: date,
        })
        .select()
        .single();
      if (error || !expense) throw error ?? new Error("insert failed");

      // 2. Upload each photo, then record it (photos are permanent afterwards).
      let failed = 0;
      for (const { file } of photos) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${me.id}/${expense.id}/${crypto.randomUUID()}-${safe}`;
        const up = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (up.error) {
          failed++;
          continue;
        }
        const { data: pub } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);
        await supabase.from("expense_photos").insert({
          expense_id: expense.id,
          storage_path: path,
          public_url: pub.publicUrl,
          uploaded_by: me.id,
        });
      }

      if (failed > 0) toast.warning(t.expenses.uploadFailed);
      toast.success(t.expenses.saved);
      router.push("/expenses");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PageHeader
        title={t.expenses.newExpense}
        action={
          <Link
            href="/expenses"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"
            aria-label={t.common.cancel}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
      />

      {/* Amount */}
      <div>
        <Label>{t.common.amount}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            ৳
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-14 pl-9 text-2xl font-bold"
            autoFocus
            required
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <Label>{t.expenses.category}</Label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition",
                category === c.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-xl">{c.emoji}</span>
              {t.categories[c.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>{t.expenses.description}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.expenses.descriptionPh}
        />
      </div>

      {/* Date */}
      <div>
        <Label>{t.expenses.spentOn}</Label>
        <Input
          type="date"
          value={date}
          max={toDateInput()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Photos */}
      <div>
        <Label>
          {t.expenses.photos}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({photos.length}/{MAX_PHOTOS_PER_EXPENSE})
          </span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <motion.div
              key={p.preview}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
          {photos.length < MAX_PHOTOS_PER_EXPENSE && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">{t.expenses.addPhotos}</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          {t.expenses.photoNote}
        </p>
      </div>

      <Button type="submit" size="lg" loading={saving} className="w-full">
        {saving ? t.common.saving : t.expenses.add}
      </Button>
    </form>
  );
}
