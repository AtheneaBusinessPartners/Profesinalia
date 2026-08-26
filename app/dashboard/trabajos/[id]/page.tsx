import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { labelForKey } from "@/lib/job-data-labels";
import { jobTypeLabel } from "@/components/JobListItem";
import StatusSelector from "@/components/StatusSelector";
import FinancialsForm from "@/components/FinancialsForm";
import type { Customer, Job, JobData, JobFinancials, JobPhoto, Message } from "@/lib/types";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const business = await getCurrentBusinessOrRedirect();
  const supabase = createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", business.id)
    .single();

  if (!job) notFound();

  const typedJob = job as Job;

  const [{ data: customer }, { data: jobData }, { data: photos }, { data: messages }, { data: financials }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", typedJob.customer_id).single(),
      supabase.from("job_data").select("*").eq("job_id", typedJob.id).single(),
      supabase.from("job_photos").select("*").eq("job_id", typedJob.id).order("created_at"),
      supabase.from("messages").select("*").eq("conversation_id", typedJob.conversation_id).order("created_at"),
      supabase.from("job_financials").select("*").eq("job_id", typedJob.id).single(),
    ]);

  const typedCustomer = customer as Customer | null;
  const typedJobData = (jobData as JobData | null)?.data ?? {};
  const typedPhotos = (photos ?? []) as JobPhoto[];
  const typedMessages = (messages ?? []) as Message[];
  const typedFinancials = financials as JobFinancials | null;

  const mapsQuery = [typedJob.address, typedJob.city, typedJob.postal_code].filter(Boolean).join(", ");
  const whatsappPhone = typedCustomer?.phone.replace(/\D/g, "") ?? "";

  return (
    <div className="px-4 py-6">
      <Link href="/dashboard/trabajos" className="text-sm text-neutral-500">
        ← Trabajos
      </Link>

      <h1 className="mt-2 text-xl font-bold">{typedJob.type ? jobTypeLabel(typedJob.type) : "Solicitud"}</h1>

      <div className="mt-4">
        <StatusSelector jobId={typedJob.id} currentStatus={typedJob.status} />
      </div>

      <section className="card mt-4">
        <p className="text-sm font-semibold text-neutral-500">Cliente</p>
        <p className="mt-1 text-lg font-semibold">{typedCustomer?.name}</p>
        <p className="text-neutral-600">📞 {typedCustomer?.phone}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${whatsappPhone}`} className="btn-secondary text-sm">
            Llamar
          </a>
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            WhatsApp
          </a>
        </div>
      </section>

      {(typedJob.city || typedJob.address) && (
        <section className="card mt-4">
          <p className="text-sm font-semibold text-neutral-500">Ubicación</p>
          <p className="mt-1">{[typedJob.address, typedJob.city, typedJob.postal_code].filter(Boolean).join(", ")}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-3 inline-flex text-sm"
          >
            Abrir en Google Maps
          </a>
        </section>
      )}

      {typedJob.ai_summary && (
        <section className="card mt-4">
          <p className="text-sm font-semibold text-neutral-500">Resumen IA</p>
          <p className="mt-1 text-neutral-800">{typedJob.ai_summary}</p>
        </section>
      )}

      {Object.keys(typedJobData).length > 0 && (
        <section className="card mt-4">
          <p className="mb-2 text-sm font-semibold text-neutral-500">Información recopilada</p>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            {Object.entries(typedJobData).map(([key, value]) => (
              <div key={key} className="col-span-2 grid grid-cols-2">
                <dt className="text-neutral-500">{labelForKey(key)}</dt>
                <dd className="font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {typedPhotos.length > 0 && (
        <section className="card mt-4">
          <p className="mb-2 text-sm font-semibold text-neutral-500">Fotografías ({typedPhotos.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {typedPhotos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <img src={p.url} alt="Foto del trabajo" className="aspect-square w-full rounded-lg object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-4">
        <p className="mb-3 text-sm font-semibold text-neutral-500">Economía</p>
        <FinancialsForm jobId={typedJob.id} initial={typedFinancials} />
      </section>

      {typedMessages.length > 0 && (
        <section className="card mt-4">
          <p className="mb-3 text-sm font-semibold text-neutral-500">Conversación</p>
          <div className="flex flex-col gap-2">
            {typedMessages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                    m.sender === "customer" ? "bg-brand-600 text-white" : "bg-neutral-100"
                  }`}
                >
                  {m.content}
                  <p className={`mt-1 text-[10px] ${m.sender === "customer" ? "text-brand-100" : "text-neutral-400"}`}>
                    {formatDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
