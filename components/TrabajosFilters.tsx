"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { JOB_STATUSES } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/job-status";
import type { JobTypeOption } from "@/lib/job-fields";

const DATE_OPTIONS = [
  { value: "todas", label: "Cualquier fecha" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Últimos 7 días" },
  { value: "mes", label: "Último mes" },
];

export default function TrabajosFilters({ typeOptions }: { typeOptions: JobTypeOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const estado = searchParams.get("estado") ?? "todas";
  const tipo = searchParams.get("tipo") ?? "todas";
  const fecha = searchParams.get("fecha") ?? "todas";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todas") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/dashboard/trabajos?${query}` : "/dashboard/trabajos");
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => updateParam("estado", "todas")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
            estado === "todas" ? "bg-brand-600 text-white" : "border border-neutral-200 bg-white text-neutral-600"
          }`}
        >
          Todas
        </button>
        {JOB_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateParam("estado", s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              estado === s ? "bg-brand-600 text-white" : "border border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {JOB_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className="input !py-2 text-sm"
          value={tipo}
          onChange={(e) => updateParam("tipo", e.target.value)}
        >
          <option value="todas">Todos los tipos</option>
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>

        <select
          className="input !py-2 text-sm"
          value={fecha}
          onChange={(e) => updateParam("fecha", e.target.value)}
        >
          {DATE_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
