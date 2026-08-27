"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ApproveBusinessButton({
  businessId,
  approved,
}: {
  businessId: string;
  approved: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("businesses")
      .update({ approved: !approved })
      .eq("id", businessId)
      .select("id, approved");

    setLoading(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setMessage("No se actualizó ninguna fila (bloqueado por permisos).");
      return;
    }

    if (data[0].approved === approved) {
      setMessage("El valor no cambió (revertido).");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`rounded-lg px-3 py-1 text-xs font-medium ${
          approved ? "bg-neutral-200 text-neutral-700" : "bg-emerald-600 text-white"
        }`}
      >
        {loading ? "..." : approved ? "Revocar" : "Aprobar"}
      </button>
      {message && <p className="mt-1 max-w-[160px] text-[10px] text-red-600">{message}</p>}
    </div>
  );
}
