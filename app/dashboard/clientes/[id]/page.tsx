import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/format";
import JobListItem from "@/components/JobListItem";
import type { Customer, Job } from "@/lib/types";

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", business.id)
    .single();

  if (!customer) notFound();
  const typedCustomer = customer as Customer;

  const { data: jobsRaw } = await supabase
    .from("jobs")
    .select("*, job_photos(id)")
    .eq("customer_id", typedCustomer.id)
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  const jobs = (jobsRaw ?? []) as (Job & { job_photos: { id: string }[] })[];

  const { data: financials } = await supabase
    .from("job_financials")
    .select("sale_price, total_cost, profit, jobs!inner(customer_id)")
    .eq("jobs.customer_id", typedCustomer.id)
    .not("jobs.submitted_at", "is", null);

  const facturacionHistorica = financials?.reduce((sum, f) => sum + Number(f.sale_price), 0) ?? 0;
  const beneficioHistorico = financials?.reduce((sum, f) => sum + Number(f.profit), 0) ?? 0;

  return (
    <div className="px-4 py-6">
      <Link href="/dashboard/clientes" className="text-sm text-neutral-500">
        ← Clientes
      </Link>

      <h1 className="mt-2 text-xl font-bold">{typedCustomer.name}</h1>
      <p className="text-neutral-600">📞 {typedCustomer.phone}</p>
      <p className="mt-1 text-xs text-neutral-400">Cliente desde {formatDateTime(typedCustomer.created_at)}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-xs text-neutral-500">Facturación histórica</p>
          <p className="text-lg font-bold">{formatCurrency(facturacionHistorica)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-neutral-500">Beneficio histórico</p>
          <p className="text-lg font-bold text-emerald-700">{formatCurrency(beneficioHistorico)}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-lg font-semibold">Historial de trabajos ({jobs.length})</h2>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobListItem
            key={job.id}
            job={job}
            customerName={typedCustomer.name}
            trade={business.trade}
            photoCount={job.job_photos?.length ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
