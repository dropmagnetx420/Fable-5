import type { ExpenseCategory, Profile } from "./types";

/** Sitol Chaya is a fixed 6-member mess. */
export const MEMBER_COUNT = 6;

export const STORAGE_BUCKET = "expense-photos";

/** Public bucket for member profile photos (replaceable, owner-scoped). */
export const STORAGE_BUCKET_AVATARS = "avatars";

export interface CategoryMeta {
  key: ExpenseCategory;
  emoji: string;
  /** Tailwind classes for the category chip. */
  chip: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "grocery",
    emoji: "🛒",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    key: "vegetables",
    emoji: "🥬",
    chip: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  {
    key: "meat",
    emoji: "🍖",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    key: "others",
    emoji: "📦",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
];

export function categoryMeta(key: ExpenseCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[3];
}

export const ROUTES = {
  dashboard: "/dashboard",
  expenses: "/expenses",
  addExpense: "/expenses/new",
  meals: "/meals",
  deposits: "/deposits",
  settlement: "/settlement",
  members: "/members",
  profile: "/profile",
  foisal: "/foisal",
  login: "/login",
  register: "/register",
} as const;

/** Max photos allowed per expense entry. */
export const MAX_PHOTOS_PER_EXPENSE = 6;
export const MAX_PHOTO_SIZE_MB = 5;

/** Stand-in user id used when Supabase isn't configured (demo browsing). */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

/** Six placeholder members so the app is explorable without real data. */
export const DEMO_MEMBERS: Profile[] = [
  { id: DEMO_USER_ID, full_name: "Demo Manager", phone: null, avatar_url: null, role: "manager", created_at: "2026-01-01T00:00:00Z" },
  { id: "11111111-1111-1111-1111-111111111111", full_name: "Rahim Uddin", phone: null, avatar_url: null, role: "member", created_at: "2026-01-02T00:00:00Z" },
  { id: "22222222-2222-2222-2222-222222222222", full_name: "Karim Hasan", phone: null, avatar_url: null, role: "member", created_at: "2026-01-03T00:00:00Z" },
  { id: "33333333-3333-3333-3333-333333333333", full_name: "Sadia Akter", phone: null, avatar_url: null, role: "member", created_at: "2026-01-04T00:00:00Z" },
  { id: "44444444-4444-4444-4444-444444444444", full_name: "Tanvir Ahmed", phone: null, avatar_url: null, role: "member", created_at: "2026-01-05T00:00:00Z" },
  { id: "55555555-5555-5555-5555-555555555555", full_name: "Nabila Rahman", phone: null, avatar_url: null, role: "member", created_at: "2026-01-06T00:00:00Z" },
];
