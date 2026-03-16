import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const bankAccountSchema = z.object({
  name: z.string().min(2),
  institution: z.string().min(2),
  account_type: z.string().min(2),
  initial_balance: z.coerce.number(),
  icon_key: z.string().min(2).optional(),
  notes: z.string().optional(),
});

export const bankAccountReconciliationSchema = z.object({
  account_id: z.string().uuid(),
  reconciled_balance: z.coerce.number(),
  reconciled_at: z.string(),
  reconciliation_notes: z.string().optional(),
});

export const creditCardSchema = z.object({
  name: z.string().min(2),
  institution: z.string().min(2),
  brand: z.string().optional(),
  credit_limit: z.coerce.number().positive(),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
  notes: z.string().optional(),
});

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer", "adjustment"]),
    description: z.string().min(3),
    amount: z.coerce.number().positive(),
    category_id: z.string().uuid().nullable().optional(),
    account_id: z.string().uuid().nullable().optional(),
    destination_account_id: z.string().uuid().nullable().optional(),
    credit_card_id: z.string().uuid().nullable().optional(),
    competency_date: z.string(),
    payment_date: z.string().optional(),
    notes: z.string().optional(),
    icon_key: z.string().optional(),
    icon_url: z.string().optional(),
    installments: z.coerce.number().int().min(1).max(48).default(1),
    is_recurring: z.coerce.boolean().optional(),
    recurring_rule: z.enum(["monthly", "weekly", "yearly"]).optional(),
    fixed_expense: z.coerce.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (["income", "expense", "adjustment"].includes(data.type) && !data.category_id) {
      ctx.addIssue({
        code: "custom",
        path: ["category_id"],
        message: "Categoria e obrigatoria para receitas e despesas.",
      });
    }

    if (data.type === "transfer" && (!data.account_id || !data.destination_account_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Transferencia exige conta origem e destino.",
      });
    }

    if (data.type === "expense" && !data.account_id && !data.credit_card_id) {
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Despesa precisa de conta ou cartao.",
      });
    }

    if (data.fixed_expense && data.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["fixed_expense"],
        message: "Despesa fixa so pode ser usada em lancamentos do tipo despesa.",
      });
    }
  });

export const goalSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  target_amount: z.coerce.number().positive(),
  target_date: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  destination_account_id: z.string().uuid().optional(),
});

export const goalContributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  contribution_date: z.string(),
  source_account_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const wishlistItemSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  url: z.url("URL invalida").optional().or(z.literal("")),
  image_url: z.url("URL da imagem invalida").optional().or(z.literal("")),
  current_price: z.coerce.number().nonnegative().optional(),
  target_price: z.coerce.number().nonnegative().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  store_name: z.string().optional(),
  status: z.enum(["active", "bought", "paused", "discarded"]).default("active"),
  notes: z.string().optional(),
});

export const groceryListSchema = z.object({
  name: z.string().min(2),
  notes: z.string().optional(),
});

export const groceryItemSchema = z.object({
  list_id: z.string().uuid().optional(),
  raw_name: z.string().min(1),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  establishment: z.string().optional(),
  item_category: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

export const groceryNoteSchema = z.object({
  establishment: z.string().optional(),
  note_date: z.string().optional(),
  total_amount: z.coerce.number().nonnegative().optional(),
  raw_extracted_text: z.string().optional(),
});

export const mileageEntrySchema = z.object({
  program_id: z.string().uuid(),
  entry_type: z.enum(["earn", "transfer", "redeem", "expire", "adjustment"]),
  points: z.coerce.number().int().positive(),
  occurred_at: z.string(),
  expires_at: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const mileageGoalSchema = z.object({
  program_id: z.string().uuid(),
  goal_points: z.coerce.number().int().positive(),
  goal_due_date: z.string().optional(),
  goal_notes: z.string().optional(),
});

export const investmentAssetSchema = z.object({
  name: z.string().min(2),
  ticker: z.string().optional(),
  asset_class: z.enum(["fixed_income", "fii", "stock", "crypto"]),
  asset_subtype: z.string().optional(),
  broker: z.string().optional(),
  currency: z.string().default("BRL"),
  notes: z.string().optional(),
});

export const investmentTransactionSchema = z.object({
  asset_id: z.string().uuid(),
  transaction_type: z.enum(["buy", "sell", "income", "dividend", "interest", "deposit", "withdraw", "adjustment"]),
  transaction_date: z.string(),
  quantity: z.coerce.number().positive().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  total_amount: z.coerce.number().positive(),
  fees: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const profileSettingsSchema = z.object({
  full_name: z.string().min(2),
  currency: z.enum(["BRL", "USD", "EUR"]),
  locale: z.enum(["pt-BR", "en-US", "es-ES"]),
});

export const appSettingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  show_charts: z.boolean().default(true),
  email_alerts: z.boolean().default(true),
  weekly_digest: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(["income", "expense", "transfer", "investment", "mileage", "grocery", "goal"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});
