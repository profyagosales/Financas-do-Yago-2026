"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransaction, uploadTransactionAttachment } from "@/actions/finance";
import { setTransactionTags } from "@/actions/tags";
import { transactionSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
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
}

export function TransactionForm({ categories, accounts, cards, tags }: Props) {
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

  const selectCls = "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)]";

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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:grid-cols-2">
      <Input placeholder="Descricao" {...register("description")} />
      <Input placeholder="Valor (R$)" type="number" step="0.01" {...register("amount")} />

      <label className="space-y-1 text-sm">
        <span className="text-[color:var(--muted)]">Data de vencimento</span>
        <Input type="date" {...register("competency_date")} />
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-[color:var(--muted)]">Tipo</span>
        <select className={selectCls} {...register("type")}>
          <option value="expense">Despesa (saida)</option>
          <option value="income">Receita (entrada)</option>
        </select>
      </label>

      {isExpense ? (
        <label className="space-y-1 text-sm">
          <span className="text-[color:var(--muted)]">Despesa</span>
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
        </label>
      ) : (
        <div />
      )}

      <label className="space-y-1 text-sm">
        <span className="text-[color:var(--muted)]">Categoria</span>
        <select className={selectCls} {...register("category_id")}>
          <option value="">Selecione categoria</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-[color:var(--muted)]">Status</span>
        <select className={selectCls} {...register("status")}>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
          <option value="canceled">Cancelado</option>
        </select>
      </label>

      {status === "paid" ? (
        <label className="space-y-1 text-sm">
          <span className="text-[color:var(--muted)]">Data de pagamento</span>
          <Input type="date" {...register("payment_date")} />
        </label>
      ) : null}

      <label className="space-y-1 text-sm">
        <span className="text-[color:var(--muted)]">Forma de pagamento</span>
        <select className={selectCls} {...register("payment_method")}>
          <option value="card">Cartao</option>
          <option value="pix">Pix</option>
          <option value="debit">Debito</option>
          <option value="cash">Dinheiro</option>
          <option value="bank_transfer">Transferencia bancaria</option>
          <option value="other">Outro</option>
        </select>
      </label>

      {requireAccount ? (
        <label className="space-y-1 text-sm">
          <span className="text-[color:var(--muted)]">Conta</span>
          <select className={selectCls} {...register("account_id")}>
            <option value="">Selecione conta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {isCard ? (
        <>
          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Cartao</span>
            <select className={selectCls} {...register("credit_card_id")}>
              <option value="">Selecione cartao</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Pagamento no cartao</span>
            <select className={selectCls} {...register("payment_plan")}>
              <option value="single">A vista</option>
              <option value="installment">Parcelado</option>
            </select>
          </label>

          {showInstallments ? (
            <label className="space-y-1 text-sm">
              <span className="text-[color:var(--muted)]">Quantidade de parcelas</span>
              <select className={selectCls} {...register("installments")}> 
                {installmentOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}x
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}

      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />

      {tags.length > 0 && (
        <div className="md:col-span-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--muted-surface)] p-3">
          <p className="mb-2 text-xs font-semibold text-[color:var(--foreground)]">Tags</p>
          <TagsSelector tags={tags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
        </div>
      )}

      <div className="md:col-span-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--muted-surface)] p-3 text-sm">
        <p className="mb-2 font-semibold text-[color:var(--foreground)]">Arquivo do lancamento (opcional)</p>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-xs"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            setAttachmentFile(file);
          }}
        />
      </div>

      {status === "paid" ? (
        <div className="md:col-span-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--muted-surface)] p-3 text-sm">
          <p className="mb-2 font-semibold text-[color:var(--foreground)]">Comprovante de pagamento</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="block w-full text-xs"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              setPaymentProofFile(file);
            }}
          />
        </div>
      ) : null}

      {errors.root?.message ? <p className="md:col-span-2 text-xs text-red-600">{errors.root.message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar lancamento"}
        </Button>
      </div>
    </form>
  );
}
