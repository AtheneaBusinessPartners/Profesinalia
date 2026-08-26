"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JOB_STATUSES } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/job-status";
import type { JobStatus } from "@/lib/types";

export default function StatusSelector({ jobId, currentStatus }: { jobId: string; currentStatus: JobStatus }) {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as JobStatus;
    setStatus(next);
    setSaving(true);
    await supabase.from("jobs").update({ status: next }).eq("id", jobId);
    setSaving(false);
    router.refresh();
  }

  return (
    <select className="input" value={status} onChange={handleChange} disabled={saving}>
      {JOB_STATUSES.map((s) => (
        <option key={s} value={s}>
          {JOB_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
