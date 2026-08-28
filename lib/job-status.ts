import type { JobStatus } from "@/lib/types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  nueva: "Nueva",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  nueva: "bg-red-100 text-red-700",
  en_curso: "bg-brand-100 text-brand-700",
  completada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-neutral-200 text-neutral-500",
};

export const JOB_STATUS_DOT: Record<JobStatus, string> = {
  nueva: "bg-red-500",
  en_curso: "bg-brand-500",
  completada: "bg-emerald-500",
  cancelada: "bg-neutral-400",
};
