import Link from "next/link";
import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import JobListItem from "@/components/JobListItem";
import { JOB_STATUSES } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/job-status";
import type { Job, JobStatus } from "@/lib/types";

const FILTERS: { value: JobStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  ...JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] })),
];

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const activeFilter = (searchParams.estado ?? "todas") as JobStatus | "todas";

  let query = supabase
    .from("jobs")
    .select("*, customers(name), job_photos(id)")
    .eq("business_id", business.id)
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  if (activeFilter !== "todas") {
    query = query.eq("status", activeFilter);
  }

  const { data: jobsRaw } = await query;

  const jobs = (jobsRaw ?? []) as (Job & { customers: { name: string } | null; job_photos: { id: string }[] })[];

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Trabajos</h1>

      <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "todas" ? "/dashboard/trabajos" : `/dashboard/trabajos?estado=${f.value}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              activeFilter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white text-neutral-600 border border-neutral-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {jobs.length === 0 && (
          <p className="text-sm text-neutral-400">
            {activeFilter === "todas" ? "Aún no hay trabajos." : "No hay trabajos con ese estado."}
          </p>
        )}
        {jobs.map((job) => (
          <JobListItem
            key={job.id}
            job={job}
            customerName={job.customers?.name ?? "Cliente"}
            photoCount={job.job_photos?.length ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
