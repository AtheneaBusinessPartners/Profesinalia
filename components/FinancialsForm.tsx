"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { JobFinancials } from "@/lib/types";

export default function FinancialsForm({
  jobId,
  initial,
}: {
  jobId: string;
  initial: JobFinancials | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [salePrice, setSalePrice] = useState(initial?.sale_price ?? 0);
  const [materialCost, setMaterialCost] = useState(initial?.material_cost ?? 0);
  const [laborCost, setLaborCost] = useState(initial?.labor_cost ?? 0);
  const [travelCost, setTravelCost] = useState(initial?.travel_cost ?? 0);
  const [otherCosts, setOtherCosts] = useState(initial?.other_costs ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalCost = materialCost + laborCost + travelCost + otherCosts;
  const profit = salePrice - totalCost;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  const marginColor = useMemo(() => (profit >= 0 ? "text-emerald-700" : "text-red-600"), [profit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await supabase.from("job_financials").upsert({
      job_id: jobId,
      sale_price: salePrice,
      material_cost: materialCost,
      labor_cost: laborCost,
      travel_cost: travelCost,
      other_costs: otherCosts,
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="label">Precio cobrado al cliente</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          value={salePrice}
          onChange={(e) => setSalePrice(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Materiales</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={materialCost}
            onChange={(e) => setMaterialCost(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Mano de obra</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={laborCost}
            onChange={(e) => setLaborCost(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Desplazamiento</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={travelCost}
            onChange={(e) => setTravelCost(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Otros costes</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={otherCosts}
            onChange={(e) => setOtherCosts(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="rounded-xl bg-neutral-50 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-neutral-500">Coste total</p>
            <p className="font-semibold">{formatCurrency(totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Beneficio</p>
            <p className={`font-semibold ${marginColor}`}>{formatCurrency(profit)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Margen</p>
            <p className={`font-semibold ${marginColor}`}>{formatPercent(margin)}</p>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar economía"}
      </button>
    </form>
  );
}
