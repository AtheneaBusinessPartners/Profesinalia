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

  async function toggle() {
    setLoading(true);
    await supabase.from("businesses").update({ approved: !approved }).eq("id", businessId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1 text-xs font-medium ${
        approved ? "bg-neutral-200 text-neutral-700" : "bg-emerald-600 text-white"
      }`}
    >
      {loading ? "..." : approved ? "Revocar" : "Aprobar"}
    </button>
  );
}
