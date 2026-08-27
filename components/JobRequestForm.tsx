"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FIELDS_BY_TYPE, JOB_TYPE_OPTIONS, buildSummary, type JobType } from "@/lib/job-fields";

interface Props {
  slug: string;
  businessName: string;
  businessDescription: string;
  businessZone: string;
}

interface SessionInfo {
  jobId: string;
  token: string;
}

type Step = "contact" | "type" | "details" | "done";

function storageKey(slug: string) {
  return `profesionalia_job_${slug}`;
}

export default function JobRequestForm({ slug, businessName, businessDescription, businessZone }: Props) {
  const supabase = createClient();

  const [restoring, setRestoring] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [step, setStep] = useState<Step>("contact");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [type, setType] = useState<JobType | null>(null);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (raw) {
      const parsed: SessionInfo = JSON.parse(raw);
      setSession(parsed);
      setStep("type");
    }
    setRestoring(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setStartLoading(true);

    const { data, error } = await supabase.rpc("start_job_request", {
      p_slug: slug,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
    });

    if (error || !data || data.length === 0) {
      setStartError("No se ha podido iniciar la solicitud. Inténtalo de nuevo.");
      setStartLoading(false);
      return;
    }

    const row = data[0];
    const info: SessionInfo = { jobId: row.job_id, token: row.token };
    sessionStorage.setItem(storageKey(slug), JSON.stringify(info));
    setSession(info);
    setStep("type");
    setStartLoading(false);
  }

  function handlePickType(t: JobType) {
    setType(t);
    setFields({});
    setStep("details");
  }

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);

    try {
      const path = `${session.jobId}/${session.token}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("job-photos").getPublicUrl(path);
      await supabase.rpc("register_job_photo", {
        p_job_id: session.jobId,
        p_token: session.token,
        p_url: publicUrl.publicUrl,
      });

      setPhotos((prev) => [...prev, publicUrl.publicUrl]);
    } catch {
      // Fallo puntual de subida: el cliente puede reintentar, no bloqueamos el resto del formulario.
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !type) return;
    setSubmitError(null);
    setSubmitting(true);

    const summary = buildSummary(type, city.trim(), fields);

    const { error } = await supabase.rpc("submit_job_data", {
      p_job_id: session.jobId,
      p_token: session.token,
      p_type: type,
      p_description: description.trim() || null,
      p_city: city.trim() || null,
      p_address: address.trim() || null,
      p_postal_code: null,
      p_data: fields,
      p_summary: summary,
    });

    if (error) {
      setSubmitError("No se ha podido enviar la solicitud. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    sessionStorage.removeItem(storageKey(slug));
    setStep("done");
    setSubmitting(false);
  }

  if (restoring) return null;

  if (step === "contact" || !session) {
    return (
      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl text-white">
            ❄️
          </div>
          <h1 className="text-xl font-bold">{businessName}</h1>
          <p className="mt-1 text-neutral-600">{businessDescription}</p>
          {businessZone && <p className="text-sm text-neutral-400">{businessZone}</p>}
        </div>

        <h2 className="mb-4 text-center text-lg font-semibold">Vamos a preparar tu solicitud</h2>

        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <div>
            <label className="label">¿Cómo te llamas?</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">¿Cuál es tu teléfono?</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {startError && <p className="text-sm text-red-600">{startError}</p>}
          <button type="submit" className="btn-primary" disabled={startLoading}>
            {startLoading ? "Cargando..." : "Continuar"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "type") {
    return (
      <div className="flex flex-1 flex-col px-6 py-8">
        <h2 className="mb-1 text-center text-lg font-semibold">¿Qué necesitas?</h2>
        <p className="mb-6 text-center text-sm text-neutral-500">Elige la opción que más se ajuste</p>

        <div className="flex flex-col gap-3">
          {JOB_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePickType(opt.value)}
              className="card flex items-center gap-3 text-left transition hover:border-brand-400"
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "details" && type) {
    const fieldDefs = FIELDS_BY_TYPE[type];

    return (
      <div className="flex flex-1 flex-col px-6 py-8">
        <button onClick={() => setStep("type")} className="mb-4 text-left text-sm text-neutral-500">
          ← Cambiar tipo de trabajo
        </button>

        <h2 className="mb-4 text-lg font-semibold">Cuéntanos un poco más</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Ciudad / localidad</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>

          <div>
            <label className="label">Dirección (opcional)</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {fieldDefs.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.type === "select" ? (
                <select
                  className="input"
                  value={fields[f.key] ?? ""}
                  required={f.required}
                  onChange={(e) => updateField(f.key, e.target.value)}
                >
                  <option value="" disabled>
                    Selecciona...
                  </option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={fields[f.key] ?? ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div>
            <label className="label">¿Algo más que quieras contarnos? (opcional)</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Fotografías (opcional, pero muy recomendable)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhoto}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary w-full"
            >
              {uploading ? "Subiendo..." : "📷 Añadir fotografía"}
            </button>
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="Foto enviada" className="h-16 w-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mb-4 text-4xl">✅</div>
      <h2 className="text-lg font-semibold">¡Solicitud enviada!</h2>
      <p className="mt-2 text-neutral-600">{businessName} ha recibido tu solicitud y se pondrá en contacto contigo en breve.</p>
    </div>
  );
}
