import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

export async function getCurrentBusinessOrRedirect(): Promise<Business> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/registro/completar");

  return business as Business;
}
