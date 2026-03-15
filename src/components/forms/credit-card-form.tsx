"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCreditCard } from "@/actions/finance";
import { creditCardSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof creditCardSchema>;

export function CreditCardForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      credit_limit: 0,
      closing_day: 10,
      due_day: 17,
    },
  });

  const onSubmit = async (values: FormData) => {
    await createCreditCard(values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <Input placeholder="Nome do cartao" {...register("name")} />
      <Input placeholder="Instituicao" {...register("institution")} />
      <Input placeholder="Bandeira (opcional)" {...register("brand")} />
      <Input placeholder="Limite total" type="number" step="0.01" {...register("credit_limit")} />
      <Input placeholder="Dia de fechamento" type="number" min={1} max={31} {...register("closing_day")} />
      <Input placeholder="Dia de vencimento" type="number" min={1} max={31} {...register("due_day")} />
      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar cartao"}
        </Button>
      </div>
    </form>
  );
}
