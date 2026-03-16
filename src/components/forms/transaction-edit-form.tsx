"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateTransaction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const editSchema = z.object({
  type: z.enum(["income", "expense", "transfer", "adjustment"]),
  description: z.string().min(3),
  amount: z.coerce.number().positive(),
  category_id: z.string().optional(),
  account_id: z.string().optional(),
  destination_account_id: z.string().optional(),
  credit_card_id: z.string().optional(),
  competency_date: z.string(),
  payment_date: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "canceled"]),
  notes: z.string().optional(),
});

type FormData = z.input<typeof editSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  transactionId: string;
  initialData: {
    type: "income" | "expense" | "transfer" | "adjustment";
    description: string;
    amount: number;
    category_id?: string | null;
    account_id?: string | null;
    destination_account_id?: string | null;
    credit_card_id?: string | null;
    competency_date: string;
    payment_date?: string | null;
    status: "pending" | "paid" | "overdue" | "canceled";
    notes?: string | null;
  };
  categories: Option[];
  accounts: Option[];
  cards: Option[];
  onSuccess?: () => void;
}

export function TransactionEditForm({
  transactionId,
  initialData,
  categories,
  accounts,
  cards,
  onSuccess,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      type: initialData.type,
      description: initialData.description,
      amount: initialData.amount,
      category_id: initialData.category_id ?? "",
      account_id: initialData.account_id ?? "",
      destination_account_id: initialData.destination_account_id ?? "",
      credit_card_id: initialData.credit_card_id ?? "",
      competency_date: initialData.competency_date,
      payment_date: initialData.payment_date ?? "",
      status: initialData.status,
      notes: initialData.notes ?? "",
    },
  });

  const type = useWatch({ control, name: "type" });
  const isExpense = type === "expense";
  const isTransfer = type === "transfer";

  const onSubmit = async (values: FormData) => {
    await updateTransaction(transactionId, values);
    onSuccess?.();
  };

  const selectCls =
    "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)]";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
      <Input placeholder="Descrição" {...register("description")} />
      <Input placeholder="Valor" type="number" step="0.01" {...register("amount")} />
      <Input placeholder="Data de competencia" type="date" {...register("competency_date")} />
      <Input placeholder="Data de pagamento" type="date" {...register("payment_date")} />

      <select className={selectCls} {...register("type")}>
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
        <option value="transfer">Transferência</option>
        <option value="adjustment">Ajuste</option>
      </select>

      <select className={selectCls} {...register("status")}>
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
        <option value="overdue">Atrasado</option>
        <option value="canceled">Cancelado</option>
      </select>

      <select className={selectCls} {...register("category_id")}>
        <option value="">Selecione categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <select className={selectCls} {...register("account_id")}>
        <option value="">Conta origem</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>

      <select className={selectCls} {...register("destination_account_id")} disabled={!isTransfer}>
        <option value="">Conta destino (transferencia)</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>

      <select className={selectCls} {...register("credit_card_id")} disabled={!isExpense}>
        <option value="">Cartão de credito</option>
        {cards.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <Input className="md:col-span-2" placeholder="Observações" {...register("notes")} />

      {errors.root?.message ? (
        <p className="md:col-span-2 text-xs text-red-600">{errors.root.message}</p>
      ) : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
