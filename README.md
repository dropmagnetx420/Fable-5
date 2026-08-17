# 🍃 Sitol Chaya — Mess Expense & Meal Manager

A mobile-first **Progressive Web App** for a shared mess / house of **6 members** to
track bazaar (grocery) expenses, record daily meals, and settle up fairly at the end
of every month.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Framer Motion**, and **Supabase** (Auth · Postgres · Storage · Realtime).
Bilingual UI — **English** (default) with a one-tap **বাংলা** toggle.

---

## ✨ Features

- **Auth & roles** — email + password *and* magic-link sign-in. The **first person to
  register automatically becomes the Manager**; everyone after is a Member.
- **Expenses (everyone)** — amount, description, category (Grocery / Vegetables / Meat /
  Others), date, and **multiple photo uploads**. Photos are **permanent** — once saved
  they can never be edited or deleted (only the Manager can soft-remove a whole entry).
- **Daily meals (Manager only)** — per-day, per-member meal counts with +/– steppers;
  edit any past day.
- **Monthly settlement** — per-meal cost = total expense ÷ total meals; each member's
  share = per-meal cost × their meals; see who **owes** and who **receives**, mark it
  settled (🎉 confetti), and keep a permanent history. Export a **PDF report**.
- **Dashboard** — animated counter cards, quick actions, and a recent-expenses feed.
- **Extras** — member directory, editable profile (name / phone / photo, language,
  theme), in-app notifications, search & filters, empty/loading states, page
  transitions, dark mode, and installable PWA (offline fallback + add-to-home-screen).

---

## 🧰 Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js 14 (App Router) + TypeScript               |
| Styling     | Tailwind CSS (HSL design tokens, dark mode)        |
| Animation   | Framer Motion                                       |
| Backend     | Supabase — Auth, Postgres, Storage, Realtime       |
| PDF         | jsPDF + jspdf-autotable                            |
| Deploy      | Netlify (`@netlify/plugin-nextjs`)                 |

> The app is **browsable without Supabase** using placeholder credentials — it renders
> demo data so you can explore the UI. Writes are disabled until you connect a project.

---

## 🚀 Local setup

**Prerequisites:** Node.js **≥ 18.17** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env.local
#    …then fill in your Supabase values (see the table below).

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

Useful scripts:

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # run the production build
npm run typecheck  # tsc --noEmit
```

---

## 🗄️ Supabase setup

1. Create a project at **https://supabase.com** (free tier is fine).
2. In the dashboard go to **SQL Editor → New query**, paste the **entire contents of
   [`supabase/schema.sql`](supabase/schema.sql)**, and **Run**. This one file creates:
   - all tables (`profiles`, `expenses`, `expense_photos`, `meal_entries`,
     `monthly_settlements`, `notifications`),
   - **Row Level Security** policies (immutable photos, manager-only meals/settlements),
   - triggers (first-user → manager, expense notifications, `updated_at`),
   - the **`expense-photos`** and **`avatars`** storage buckets, and
   - Realtime broadcasting for the relevant tables.

   It is safe to re-run (uses `if not exists` / `or replace` / `drop … if exists`).
3. **Auth → Providers → Email:** ensure **Email** is enabled. For password sign-up
   without email confirmation during testing, you can disable "Confirm email"
   (**Auth → Providers → Email → Confirm email**).
4. **Auth → URL Configuration:** set **Site URL** to your app URL and add it to
   **Redirect URLs** (e.g. `http://localhost:3000/**` for dev and
   `https://your-site.netlify.app/**` for production). This is required for magic links.
5. Copy your keys from **Project Settings → API** into `.env.local` (next section).

The **first account you register** becomes the **Manager** automatically.

---

## 🔑 Environment variables

Copy `.env.example` → `.env.local` and set:

| Variable                        | Required | Description                                                                 |
| ------------------------------- | :------: | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      |    ✅    | Project URL, e.g. `https://abcdxyz.supabase.co`                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |    ✅    | Public anon key (safe in the browser)                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     |    –     | Server-only admin key (optional; keep secret, never expose to the client)   |
| `NEXT_PUBLIC_SITE_URL`          |    ✅    | Public site URL for email / magic-link redirects (`http://localhost:3000` locally) |

---

## ☁️ Deploy to Netlify

A [`netlify.toml`](netlify.toml) is included with the official Next.js plugin, so most
settings are automatic.

1. Push this repo to GitHub/GitLab.
2. In Netlify: **Add new site → Import an existing project**, then pick the repo.
   Build command `next build` and the `@netlify/plugin-nextjs` plugin are picked up
   from `netlify.toml` (Node 20).
3. **Site settings → Environment variables:** add the four variables above. Set
   `NEXT_PUBLIC_SITE_URL` to your Netlify URL (e.g. `https://your-site.netlify.app`).
4. Back in **Supabase → Auth → URL Configuration**, add the Netlify URL to **Site URL**
   and **Redirect URLs** (`https://your-site.netlify.app/**`).
5. **Deploy.** Redeploy after any env-var change.

---

## 📱 PWA & icons

The app ships a `manifest.webmanifest`, a service worker (`public/sw.js`) with an
offline fallback (`public/offline.html`), and an add-to-home-screen prompt. The app icon
is a scalable **SVG** (`public/icons/icon.svg`), which installs cleanly on Android/Chrome.

> **iOS home-screen icons** don't support SVG. If you need crisp iOS icons, add
> `public/icons/icon-192.png` and `icon-512.png` and reference them in
> `app/layout.tsx` (`metadata.icons`) and `public/manifest.webmanifest`.

The service worker is only active in a production build (`npm run build && npm run start`
or on Netlify), not in `npm run dev`.

---

## 🗂️ Project structure

```
app/
  (auth)/            login & register (magic link + password)
  (app)/             dashboard, expenses, meals, settlement, members, profile
  auth/callback/     Supabase email/magic-link exchange
components/          ui kit, layout shell, and per-feature client components
lib/
  supabase/          browser + server clients, middleware, env guard
  queries.ts         typed data fetchers
  settlement.ts      per-meal cost & balance math
  pdf.ts             monthly settlement PDF
  i18n/              English + Bengali dictionaries
supabase/schema.sql  full schema + RLS + storage + triggers (run once)
```

---

Made for **Sitol Chaya** 🍃 — cool shade, fair share.
