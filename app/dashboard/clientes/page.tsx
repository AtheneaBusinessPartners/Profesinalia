import Link from "next/link";
import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/format";
import type { Customer } from "@/lib/types";

export default async function ClientesPage() {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const { data: customersRaw } = await supabase
    .from("customers")
    .select("*, jobs(id, created_at)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const customers = (customersRaw ?? []) as (Customer & { jobs: { id: string; created_at: string }[] })[];

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>

      <div className="flex flex-col gap-3">
        {customers.length === 0 && <p className="text-sm text-neutral-400">Todavía no tienes clientes.</p>}
        {customers.map((c) => {
          const lastJob = c.jobs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          return (
            <Link key={c.id} href={`/dashboard/clientes/${c.id}`} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-neutral-500">{c.phone}</p>
              </div>
              <div className="text-right text-sm text-neutral-500">
                <p>{c.jobs.length} trabajo{c.jobs.length === 1 ? "" : "s"}</p>
                {lastJob && <p>{formatRelativeTime(lastJob.created_at)}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
