"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/schemas";

export async function signInWithPassword(formData: FormData) {
  const payload = loginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(payload);

  if (error) {
    redirect("/login" as never);
  }

  redirect("/dashboard" as never);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login" as never);
}
