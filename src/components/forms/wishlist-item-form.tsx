"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWishlistItem } from "@/actions/wishlist";
import { wishlistItemSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof wishlistItemSchema>;

export function WishlistItemForm() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(wishlistItemSchema),
    defaultValues: {
      priority: "medium",
      status: "active",
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);

    const result = await createWishlistItem({
      ...values,
      category: values.category?.trim() || undefined,
      url: values.url?.trim() || undefined,
      image_url: values.image_url?.trim() || undefined,
      store_name: values.store_name?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Nao foi possivel criar o item.");
      return;
    }

    reset({
      name: "",
      category: "",
      url: "",
      image_url: "",
      current_price: undefined,
      target_price: undefined,
      priority: "medium",
      store_name: "",
      status: "active",
      notes: "",
    });
    setMessage("Item adicionado com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Nome do item" {...register("name")} />
      <Input placeholder="Categoria" {...register("category")} />
      <Input placeholder="Loja" {...register("store_name")} />
      <Input placeholder="Link do produto" {...register("url")} />
      <Input placeholder="Link da imagem" {...register("image_url")} />
      <Input type="number" step="0.01" placeholder="Preco atual" {...register("current_price")} />
      <Input type="number" step="0.01" placeholder="Preco desejado" {...register("target_price")} />

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("priority")}>
        <option value="low">Prioridade baixa</option>
        <option value="medium">Prioridade media</option>
        <option value="high">Prioridade alta</option>
      </select>

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("status")}>
        <option value="active">Ativo</option>
        <option value="paused">Pausado</option>
        <option value="bought">Comprado</option>
        <option value="discarded">Descartado</option>
      </select>

      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />

      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Adicionar item"}
        </Button>
      </div>
    </form>
  );
}