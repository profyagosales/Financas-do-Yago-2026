"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransaction, uploadTransactionAttachment } from "@/actions/finance";
import { setTransactionTags } from "@/actions/tags";
import { transactionSchema } from "@/lib/validators/schemas";
import { Input } from "@/components/ui/input";
import { TagsSelector } from "@/components/forms/tags-selector";

const formSchema = transactionSchema.safeExtend({
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional(),
  credit_card_id: z.string().uuid().optional(),
  payment_method: z.enum(["card", "pix", "debit", "cash", "bank_transfer", "other"]),
  payment_plan: z.enum(["single", "installment"]).default("single"),
  expense_mode: z.enum(["single", "fixed"]).default("single"),
  payment_proof_required: z.boolean().default(false),
  destination_account_id: z.string().optional(),
});

type FormInput = z.input<typeof formSchema>;

interface Option {
  id: string;
  label: string;
  type?: "income" | "expense" | "transfer" | "investment" | "mileage" | "grocery" | "goal";
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  categories: Option[];
  accounts: Option[];
  cards: Option[];
  tags: Tag[];
  formId?: string;
}

export function TransactionForm({ categories, accounts, cards, tags, formId }: Props) {
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      competency_date: new Date().toISOString().slice(0, 10),
      installments: 1,
      fixed_expense: false,
      status: "pending",
      payment_method: "debit",
      payment_plan: "single",
      expense_mode: "single",
      payment_proof_required: false,
    },
  });

  const currentType = useWatch({ control, name: "type" });
  const status = useWatch({ control, name: "status" });
  const paymentMethod = useWatch({ control, name: "payment_method" });
  const paymentPlan = useWatch({ control, name: "payment_plan" });
  const expenseMode = useWatch({ control, name: "expense_mode" });

  const isExpense = currentType === "expense";
  const isCard = paymentMethod === "card";
  const showInstallments = isExpense && isCard && paymentPlan === "installment";
  const requireAccount = paymentMethod === "pix" || paymentMethod === "debit" || paymentMethod === "bank_transfer";

  const categoryOptions = categories.filter((category) => {
    if (!category.type) return true;
    return category.type === currentType;
  });

  const selectCls = "w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]";
  const inputCls = "w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]";
  const sectionCls = "rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/85 p-4";

  const installmentOptions = Array.from({ length: 150 }, (_, i) => i + 1);

  const onSubmit = async (values: FormInput) => {
    const normalize = (value?: string) => {
      if (!value || value.trim() === "") return undefined;
      return value;
    };

    const installments = showInstallments ? Number(values.installments ?? 1) : 1;

    const result = await createTransaction({
      ...values,
      category_id: normalize(values.category_id),
      account_id: requireAccount ? normalize(values.account_id) : undefined,
      credit_card_id: isCard ? normalize(values.credit_card_id) : undefined,
      destination_account_id: undefined,
      installments,
      fixed_expense: isExpense && expenseMode === "fixed",
      status: values.status,
      payment_date: values.status === "paid" ? normalize(values.payment_date) : undefined,
      payment_method: values.payment_method,
    });

    if (!result?.ok || !result.id) return;

    if (selectedTagIds.length > 0) {
      await setTransactionTags(result.id, selectedTagIds);
    }

    if (attachmentFile) {
      const fd = new FormData();
      fd.append("transaction_id", result.id);
      fd.append("attachment_kind", "bill");
      fd.append("file", attachmentFile);
      await uploadTransactionAttachment(fd);
    }

    if (values.status === "paid" && paymentProofFile) {
      const fdProof = new FormData();
      fdProof.append("transaction_id", result.id);
      fdProof.append("attachment_kind", "receipt");
      fdProof.append("file", paymentProofFile);
      await uploadTransactionAttachment(fdProof);
    }

    setAttachmentFile(null);
    setPaymentProofFile(null);
    setSelectedTagIds([]);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className={sectionCls}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Descricao</label>
        <Input className={inputCls} placeholder="Ex.: Conta de energia" {...register("description")} />

        <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Valor</label>
        <Input className={inputCls} placeholder="0,00" type="number" step="0.01" {...register("amount")} />
      </div>

      <div className={sectionCls}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Data de vencimento</label>
        <Input className={inputCls} type="date" {...register("competency_date")} />

        <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Tipo</label>
        <select className={selectCls} {...register("type")}>
          <option value="expense">Despesa (saida)</option>
          <option value="income">Receita (entrada)</option>
        </select>

        <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Status</label>
        <select className={selectCls} {...register("status")}>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
          <option value="canceled">Cancelado</option>
        </select>

        {status === "paid" ? (
          <>
            <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Data de pagamento</label>
            <Input className={inputCls} type="date" {...register("payment_date")} />
          </>
        ) : null}

        {isExpense ? (
          <>
            <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Despesa</label>
            <select
              className={selectCls}
              {...register("expense_mode")}
              onChange={(event) => {
                const next = event.currentTarget.value as "single" | "fixed";
                setValue("expense_mode", next);
                setValue("fixed_expense", next === "fixed");
              }}
            >
              <option value="single">Unica</option>
              <option value="fixed">Fixa</option>
            </select>
          </>
        ) : null}

        <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Categoria</label>
        <select className={selectCls} {...register("category_id")}>
          <option value="">Selecione categoria</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className={sectionCls}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Forma de pagamento</label>
        <select className={selectCls} {...register("payment_method")}>
          <option value="card">Cartao</option>
          <option value="pix">Pix</option>
          <option value="debit">Debito</option>
          <option value="cash">Dinheiro</option>
          <option value="bank_transfer">Transferencia bancaria</option>
          <option value="other">Outro</option>
        </select>

        {requireAccount ? (
          <>
            <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Conta</label>
            <select className={selectCls} {...register("account_id")}>
              <option value="">Selecione conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {isCard ? (
          <>
            <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Cartao</label>
            <select className={selectCls} {...register("credit_card_id")}>
              <option value="">Selecione cartao</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.label}
                </option>
              ))}
            </select>

            <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Pagamento no cartao</label>
            <select className={selectCls} {...register("payment_plan")}>
              <option value="single">A vista</option>
              <option value="installment">Parcelado</option>
            </select>

            {showInstallments ? (
              <>
                <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Quantidade de parcelas</label>
                <select className={selectCls} {...register("installments")}>
                  {installmentOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}x
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={sectionCls}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Observacoes</label>
        <Input className={inputCls} placeholder="Detalhes relevantes do lancamento" {...register("notes")} />
      </div>

      {tags.length > 0 ? (
        <div className={sectionCls}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Tags</p>
          <TagsSelector tags={tags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
        </div>
      ) : null}

      <div className={sectionCls}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Arquivo do lancamento</p>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 text-xs"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            setAttachmentFile(file);
          }}
        />
      </div>

      {status === "paid" ? (
        <div className={sectionCls}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Comprovante de pagamento</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="block w-full rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 text-xs"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              setPaymentProofFile(file);
            }}
          />
        </div>
      ) : null}

      {errors.root?.message ? <p className="text-xs text-red-600">{errors.root.message}</p> : null}
      {isSubmitting ? <p className="text-xs text-[color:var(--muted)]">Salvando...</p> : null}
    </form>
  );
}
