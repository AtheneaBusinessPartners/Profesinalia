import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/format";
import LinkCard from "@/components/LinkCard";
import SignOutButton from "@/components/SignOutButton";
import JobListItem from "@/components/JobListItem";
import type { Job } from "@/lib/types";

export default async function DashboardHomePage() {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("business_id", business.id)
    .not("submitted_at", "is", null);

  const nuevas = allJobs?.filter((j) => j.status === "nueva").length ?? 0;
  const enCurso = allJobs?.filter((j) => j.status === "en_curso").length ?? 0;
  const completadas = allJobs?.filter((j) => j.status === "completada").length ?? 0;

  const { data: financials } = await supabase
    .from("job_financials")
    .select("sale_price, total_cost, profit, jobs!inner(business_id, created_at)")
    .eq("jobs.business_id", business.id);

  const totalFacturacion = financials?.reduce((sum, f) => sum + Number(f.sale_price), 0) ?? 0;

  const now = new Date();
  const monthFinancials =
    financials?.filter((f) => {
      const created = new Date((f.jobs as unknown as { created_at: string }).created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }) ?? [];

  const monthFacturacion = monthFinancials.reduce((sum, f) => sum + Number(f.sale_price), 0);
  const monthCostes = monthFinancials.reduce((sum, f) => sum + Number(f.total_cost), 0);
  const monthBeneficio = monthFacturacion - monthCostes;
  const monthMargen = monthFacturacion > 0 ? (monthBeneficio / monthFacturacion) * 100 : 0;

  const { data: recentJobsRaw } = await supabase
    .from("jobs")
    .select("*, customers(name), job_photos(id)")
    .eq("business_id", business.id)
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentJobs = (recentJobsRaw ?? []) as (Job & { customers: { name: string } | null; job_photos: { id: string }[] })[];

  const firstName = business.name.split(" ")[0];

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">Buenos días,</p>
          <h1 className="text-2xl font-bold">{firstName}</h1>
        </div>
        <SignOutButton />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{nuevas}</p>
          <p className="text-xs text-neutral-500">Nuevas</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-600">{enCurso}</p>
          <p className="text-xs text-neutral-500">En curso</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-neutral-700">{completadas}</p>
          <p className="text-xs text-neutral-500">Completados</p>
        </div>
      </div>

      <div className="card mb-4">
        <p className="text-sm text-neutral-500">Facturación total</p>
        <p className="text-2xl font-bold">{formatCurrency(totalFacturacion)}</p>
      </div>

      <div className="card mb-6">
        <p className="mb-2 text-sm font-semibold text-neutral-500">Este mes</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-neutral-500">Facturación</p>
            <p className="font-semibold">{formatCurrency(monthFacturacion)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Costes</p>
            <p className="font-semibold">{formatCurrency(monthCostes)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Beneficio</p>
            <p className="font-semibold text-emerald-700">{formatCurrency(monthBeneficio)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Margen</p>
            <p className="font-semibold text-emerald-700">{formatPercent(monthMargen)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <LinkCard slug={business.slug} />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Solicitudes recientes</h2>
      <div className="flex flex-col gap-3">
        {recentJobs.length === 0 && (
          <p className="text-sm text-neutral-400">
            Todavía no tienes solicitudes. Comparte tu enlace para recibir la primera.
          </p>
        )}
        {recentJobs.map((job) => (
          <JobListItem
            key={job.id}
            job={job}
            customerName={job.customers?.name ?? "Cliente"}
            trade={business.trade}
            photoCount={job.job_photos?.length ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
