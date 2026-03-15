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
  target_amount: z.coerce.number().positive(),
  target_date: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const goalContributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  contribution_date: z.string(),
  source_account_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});
