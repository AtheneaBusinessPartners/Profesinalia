"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("No se pudo crear la cuenta.");

      let slugBase = slugify(businessName);
      if (!slugBase) slugBase = slugify(fullName) || "negocio";
      let slug = slugBase;

      if (!signUpData.session) {
        // Confirmación de email activada: no hay sesión todavía, no podemos crear el negocio
        // (RLS exige auth.uid()). Se creará en el primer login.
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }

      // Intentar insertar el negocio; si el slug ya existe, añadir sufijo
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error: insertError } = await supabase.from("businesses").insert({
          owner_id: signUpData.user.id,
          name: businessName || fullName,
          slug,
          phone,
          zone,
          email,
        });

        if (!insertError) {
          router.push("/dashboard");
          return;
        }

        if (insertError.code === "23505") {
          slug = `${slugBase}-${Math.floor(Math.random() * 900 + 100)}`;
          continue;
        }

        throw insertError;
      }

      throw new Error("No se pudo generar un enlace único. Inténtalo de nuevo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ha ocurrido un error.");
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-12 text-center">
        <h1 className="text-xl font-bold">Revisa tu correo</h1>
        <p className="text-neutral-600">
          Te hemos enviado un enlace de confirmación a {email}. Una vez confirmado, inicia sesión
          para terminar de crear tu perfil.
        </p>
        <Link href="/login" className="btn-primary">
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">Crear mi perfil</h1>
      <p className="mt-1 text-sm text-neutral-600">
        En un minuto tendrás tu enlace listo para mandar por WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Apellidos</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input
            className="input"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <hr className="my-2 border-neutral-200" />

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
          <input
            className="input"
            placeholder="Madrid y alrededores"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
        </div>

        {businessName && (
          <p className="text-sm text-neutral-500">
            Tu enlace será: <span className="font-mono">profesionalia.com/c/{slugify(businessName)}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear mi perfil"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand-600 underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
