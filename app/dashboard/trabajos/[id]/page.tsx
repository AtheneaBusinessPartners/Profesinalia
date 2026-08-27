import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import { createClient } from "@/lib/supabase/server";
import { labelForKey } from "@/lib/job-data-labels";
import { jobTypeLabelFor } from "@/lib/job-fields";
import StatusSelector from "@/components/StatusSelector";
import FinancialsForm from "@/components/FinancialsForm";
import type { Customer, Job, JobData, JobFinancials, JobPhoto } from "@/lib/types";

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

  const [{ data: customer }, { data: jobData }, { data: photos }, { data: financials }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", typedJob.customer_id).single(),
    supabase.from("job_data").select("*").eq("job_id", typedJob.id).single(),
    supabase.from("job_photos").select("*").eq("job_id", typedJob.id).order("created_at"),
    supabase.from("job_financials").select("*").eq("job_id", typedJob.id).single(),
  ]);

  const typedCustomer = customer as Customer | null;
  const typedJobData = (jobData as JobData | null)?.data ?? {};
  const typedPhotos = (photos ?? []) as JobPhoto[];
  const typedFinancials = financials as JobFinancials | null;

  const mapsQuery = [typedJob.address, typedJob.city, typedJob.postal_code].filter(Boolean).join(", ");
  const whatsappPhone = typedCustomer?.phone.replace(/\D/g, "") ?? "";

  return (
    <div className="px-4 py-6">
      <Link href="/dashboard/trabajos" className="text-sm text-neutral-500">
        ← Trabajos
      </Link>

      <h1 className="mt-2 text-xl font-bold">
        {typedJob.type ? jobTypeLabelFor(business.trade, typedJob.type) : "Solicitud"}
      </h1>

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

      {typedJob.summary && (
        <section className="card mt-4">
          <p className="text-sm font-semibold text-neutral-500">Resumen</p>
          <p className="mt-1 text-neutral-800">{typedJob.summary}</p>
          {typedJob.description && <p className="mt-2 text-sm text-neutral-600">"{typedJob.description}"</p>}
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
    </div>
  );
}
