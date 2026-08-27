import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import JobListItem from "@/components/JobListItem";
import type { Job } from "@/lib/types";

export default async function TrabajosPage() {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const { data: jobsRaw } = await supabase
    .from("jobs")
    .select("*, customers(name), job_photos(id)")
    .eq("business_id", business.id)
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  const jobs = (jobsRaw ?? []) as (Job & { customers: { name: string } | null; job_photos: { id: string }[] })[];

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Trabajos</h1>

      <div className="flex flex-col gap-3">
        {jobs.length === 0 && <p className="text-sm text-neutral-400">Aún no hay trabajos.</p>}
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
