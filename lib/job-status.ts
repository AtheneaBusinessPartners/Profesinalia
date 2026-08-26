import type { JobStatus } from "@/lib/types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  presupuesto_enviado: "Presupuesto enviado",
  aceptada: "Aceptada",
  en_curso: "En curso",
  completada: "Completada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  nueva: "bg-red-100 text-red-700",
  en_revision: "bg-amber-100 text-amber-700",
  presupuesto_enviado: "bg-blue-100 text-blue-700",
  aceptada: "bg-emerald-100 text-emerald-700",
  en_curso: "bg-brand-100 text-brand-700",
  completada: "bg-neutral-200 text-neutral-700",
  rechazada: "bg-neutral-200 text-neutral-500",
  cancelada: "bg-neutral-200 text-neutral-500",
};

export const JOB_STATUS_DOT: Record<JobStatus, string> = {
  nueva: "bg-red-500",
  en_revision: "bg-amber-500",
  presupuesto_enviado: "bg-blue-500",
  aceptada: "bg-emerald-500",
  en_curso: "bg-brand-500",
  completada: "bg-neutral-400",
  rechazada: "bg-neutral-400",
  cancelada: "bg-neutral-400",
};
