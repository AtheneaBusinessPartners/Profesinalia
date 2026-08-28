import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import JobListItem from "@/components/JobListItem";
import TrabajosFilters from "@/components/TrabajosFilters";
import { JOB_TYPES_BY_TRADE } from "@/lib/job-fields";
import type { Job, JobStatus } from "@/lib/types";

function dateThreshold(fecha?: string): string | null {
  const now = new Date();
  if (fecha === "hoy") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (fecha === "semana") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (fecha === "mes") {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return null;
}

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: { estado?: string; tipo?: string; fecha?: string };
}) {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  let query = supabase
    .from("jobs")
    .select("*, customers(name), job_photos(id)")
    .eq("business_id", business.id)
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  if (searchParams.estado) {
    query = query.eq("status", searchParams.estado as JobStatus);
  }
  if (searchParams.tipo) {
    query = query.eq("type", searchParams.tipo);
  }
  const since = dateThreshold(searchParams.fecha);
  if (since) {
    query = query.gte("created_at", since);
  }

  const { data: jobsRaw } = await query;

  const jobs = (jobsRaw ?? []) as (Job & { customers: { name: string } | null; job_photos: { id: string }[] })[];

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Trabajos</h1>

      <TrabajosFilters typeOptions={JOB_TYPES_BY_TRADE[business.trade]} />

      <div className="flex flex-col gap-3">
        {jobs.length === 0 && (
          <p className="text-sm text-neutral-400">No hay trabajos que coincidan con estos filtros.</p>
        )}
        {jobs.map((job) => (
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
