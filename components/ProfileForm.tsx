"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/lib/types";

export default function ProfileForm({ business }: { business: Business }) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description);
  const [phone, setPhone] = useState(business.phone);
  const [zone, setZone] = useState(business.zone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("businesses").update({ name, description, phone, zone }).eq("id", business.id);
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Nombre del negocio</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div>
        <label className="label">Zona de trabajo</label>
        <input className="input" value={zone} onChange={(e) => setZone(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar cambios"}
      </button>
    </form>
  );
}
