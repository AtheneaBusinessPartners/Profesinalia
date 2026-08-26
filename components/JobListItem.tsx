import Link from "next/link";
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from "@/lib/job-status";
import { formatRelativeTime } from "@/lib/format";
import type { Job } from "@/lib/types";

interface Props {
  job: Job;
  customerName: string;
  photoCount?: number;
}

export default function JobListItem({ job, customerName, photoCount }: Props) {
  return (
    <Link href={`/dashboard/trabajos/${job.id}`} className="card block">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${JOB_STATUS_STYLES[job.status]}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
        <span className="text-xs text-neutral-400">{formatRelativeTime(job.created_at)}</span>
      </div>
      <p className="mt-2 font-semibold">{job.type ? jobTypeLabel(job.type) : "Solicitud en curso"}</p>
      <p className="text-sm text-neutral-600">{customerName}</p>
      <p className="text-sm text-neutral-400">
        {[job.city, photoCount ? `${photoCount} foto${photoCount === 1 ? "" : "s"}` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}

export function jobTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    instalacion: "Instalación de aire acondicionado",
    reparacion: "Reparación de aire acondicionado",
    mantenimiento: "Mantenimiento de aire acondicionado",
    otro: "Solicitud",
  };
  return labels[type] ?? "Solicitud";
}
