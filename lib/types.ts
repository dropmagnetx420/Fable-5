// Central database + domain types for Sitol Chaya.
// These mirror the SQL schema in /supabase/schema.sql.

export type UserRole = "manager" | "member";

export type ExpenseCategory = "grocery" | "vegetables" | "meat" | "others";

export type NotificationType =
  | "expense"
  | "settlement"
  | "meal"
  | "deposit"
  | "system";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Expense {
  id: string;
  created_by: string;
  amount: number;
  description: string | null;
  category: ExpenseCategory;
  spent_on: string; // date (YYYY-MM-DD)
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface ExpensePhoto {
  id: string;
  expense_id: string;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface MealEntry {
  id: string;
  member_id: string;
  entry_date: string; // date (YYYY-MM-DD)
  meal_count: number;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  member_id: string;
  amount: number;
  deposit_date: string; // date (YYYY-MM-DD)
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

// One row per member inside a settlement's breakdown JSON.
export interface SettlementLine {
  member_id: string;
  name: string;
  meals: number;
  share: number; // amount this member should pay
  paid: number; // amount this member deposited into the pot
  balance: number; // paid - share  (positive = receives, negative = owes)
}

export interface MonthlySettlement {
  id: string;
  month: string; // 'YYYY-MM'
  total_expense: number;
  total_meals: number;
  per_meal_cost: number;
  breakdown: SettlementLine[];
  is_settled: boolean;
  generated_by: string | null;
  generated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Composed view types used across the UI
export interface ExpenseWithDetails extends Expense {
  photos: ExpensePhoto[];
  author: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

// ---------------------------------------------------------------------------
// Supabase generic Database type (used with createClient<Database>()).
// Only the fields the client needs are typed; keeps things pragmatic.
// ---------------------------------------------------------------------------
type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>;
        Insert: Insert<Profile>;
        Update: Update<Profile>;
      };
      expenses: {
        Row: Row<Expense>;
        Insert: Insert<Expense>;
        Update: Update<Expense>;
      };
      expense_photos: {
        Row: Row<ExpensePhoto>;
        Insert: Insert<ExpensePhoto>;
        Update: Update<ExpensePhoto>;
      };
      meal_entries: {
        Row: Row<MealEntry>;
        Insert: Insert<MealEntry>;
        Update: Update<MealEntry>;
      };
      deposits: {
        Row: Row<Deposit>;
        Insert: Insert<Deposit>;
        Update: Update<Deposit>;
      };
      monthly_settlements: {
        Row: Row<Omit<MonthlySettlement, "breakdown"> & { breakdown: unknown }>;
        Insert: Insert<Omit<MonthlySettlement, "breakdown"> & { breakdown: unknown }>;
        Update: Update<Omit<MonthlySettlement, "breakdown"> & { breakdown: unknown }>;
      };
      notifications: {
        Row: Row<AppNotification>;
        Insert: Insert<AppNotification>;
        Update: Update<AppNotification>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
