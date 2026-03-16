export type ID = string;

export type TransactionType = "income" | "expense" | "transfer" | "adjustment";
export type TransactionStatus = "pending" | "paid" | "overdue" | "canceled";

export interface Profile {
  id: ID;
  full_name: string;
  avatar_url?: string | null;
  currency: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: ID;
  user_id: ID;
  name: string;
  institution: string;
  account_type: string;
  icon_key?: string | null;
  color?: string | null;
  initial_balance: number;
  reconciled_balance?: number | null;
  reconciled_at?: string | null;
  reconciliation_notes?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: ID;
  user_id: ID;
  name: string;
  institution: string;
  brand?: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: ID;
  user_id: ID;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: ID;
  user_id: ID;
  name: string;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: ID;
  user_id: ID;
  type: TransactionType;
  description: string;
  amount: number;
  category_id?: ID | null;
  account_id?: ID | null;
  destination_account_id?: ID | null;
  credit_card_id?: ID | null;
  competency_date: string;
  payment_date?: string | null;
  status: TransactionStatus;
  notes?: string | null;
  icon_key?: string | null;
  icon_url?: string | null;
  is_recurring: boolean;
  recurring_rule?: string | null;
  installment_group_id?: ID | null;
  attachment_count: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionInstallment {
  id: ID;
  user_id: ID;
  installment_group_id: ID;
  transaction_id: ID;
  installment_number: number;
  total_installments: number;
  bill_month: string;
  amount: number;
  created_at: string;
}

export interface CardBill {
  id: ID;
  user_id: ID;
  credit_card_id: ID;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: ID;
  user_id: ID;
  related_type: string;
  related_id: ID;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface InvestmentAsset {
  id: ID;
  user_id: ID;
  name: string;
  ticker?: string | null;
  asset_class: "fixed_income" | "fii" | "stock" | "crypto";
  asset_subtype?: string | null;
  broker?: string | null;
  currency: string;
  current_value?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: ID;
  user_id: ID;
  asset_id: ID;
  transaction_type:
    | "buy"
    | "sell"
    | "income"
    | "dividend"
    | "interest"
    | "deposit"
    | "withdraw"
    | "adjustment"
    | "bonus";
  transaction_date: string;
  quantity?: number | null;
  unit_price?: number | null;
  total_amount: number;
  fees: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageProgram {
  id: ID;
  user_id: ID;
  name: string;
  is_active: boolean;
  goal_points?: number | null;
  goal_due_date?: string | null;
  goal_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageEntry {
  id: ID;
  user_id: ID;
  program_id: ID;
  entry_type: "earn" | "transfer" | "redeem" | "expire" | "adjustment";
  points: number;
  occurred_at: string;
  expires_at?: string | null;
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroceryList {
  id: ID;
  user_id: ID;
  name: string;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroceryItem {
  id: ID;
  user_id: ID;
  list_id?: ID | null;
  normalized_name: string;
  raw_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  total_price?: number | null;
  establishment?: string | null;
  purchased_at?: string | null;
  item_category?: string | null;
  is_favorite: boolean;
  was_purchased: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroceryNote {
  id: ID;
  user_id: ID;
  establishment?: string | null;
  note_date?: string | null;
  total_amount?: number | null;
  raw_extracted_text?: string | null;
  review_status: "pending_review" | "reviewed";
  created_at: string;
  updated_at: string;
}

export interface GroceryPriceHistory {
  id: ID;
  user_id: ID;
  grocery_item_id?: ID | null;
  normalized_name: string;
  establishment: string;
  unit_price: number;
  quantity_reference?: number | null;
  unit?: string | null;
  purchased_at: string;
  created_at: string;
}

export interface WishlistItem {
  id: ID;
  user_id: ID;
  name: string;
  category?: string | null;
  url?: string | null;
  image_url?: string | null;
  current_price?: number | null;
  target_price?: number | null;
  priority: "low" | "medium" | "high";
  store_name?: string | null;
  status: "active" | "bought" | "paused" | "discarded";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: ID;
  user_id: ID;
  name: string;
  description?: string | null;
  target_amount: number;
  target_date?: string | null;
  category?: string | null;
  priority: "low" | "medium" | "high";
  status: "active" | "paused" | "completed";
  destination_account_id?: ID | null;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: ID;
  user_id: ID;
  goal_id: ID;
  amount: number;
  contribution_date: string;
  source_account_id?: ID | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: ID;
  user_id: ID;
  theme: "system" | "light" | "dark";
  dashboard_config: Record<string, unknown>;
  notification_prefs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
