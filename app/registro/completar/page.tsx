"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CompletarPerfilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setChecking(false);
    });
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    const slugBase = slugify(businessName) || "negocio";
    let slug = slugBase;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { error: insertError } = await supabase.from("businesses").insert({
        owner_id: data.user.id,
        name: businessName,
        slug,
        phone,
        zone,
        email: data.user.email ?? "",
      });

      if (!insertError) {
        router.push("/dashboard");
        return;
      }

      if (insertError.code === "23505") {
        slug = `${slugBase}-${Math.floor(Math.random() * 900 + 100)}`;
        continue;
      }

      setError(insertError.message);
      setLoading(false);
      return;
    }

    setError("No se pudo generar un enlace único. Inténtalo de nuevo.");
    setLoading(false);
  }

  if (checking) return null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">Termina de crear tu perfil</h1>
      <p className="mt-1 text-sm text-neutral-600">Solo nos faltan los datos de tu negocio.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="label">Nombre del negocio</label>
          <input
            className="input"
            placeholder="Juan Clima"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear mi perfil"}
        </button>
      </form>
    </main>
  );
}
