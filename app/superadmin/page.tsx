import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/format";
import SignOutButton from "@/components/SignOutButton";
import ApproveBusinessButton from "@/components/ApproveBusinessButton";

export default async function SuperadminPage() {
  const supabase = createClient();

  const { data: businessesRaw } = await supabase
    .from("businesses")
    .select("*, jobs(id, status, submitted_at)")
    .order("created_at", { ascending: false });

  const businesses = (businessesRaw ?? []) as (import("@/lib/types").Business & {
    jobs: { id: string; status: string; submitted_at: string | null }[];
  })[];

  const { data: financials } = await supabase.from("job_financials").select("sale_price, profit");

  const totalProfesionales = businesses.length;
  const totalSolicitudes = businesses.reduce(
    (sum, b) => sum + b.jobs.filter((j) => j.submitted_at).length,
    0
  );
  const totalCompletados = businesses.reduce(
    (sum, b) => sum + b.jobs.filter((j) => j.submitted_at && j.status === "completada").length,
    0
  );
  const facturacionTotal = financials?.reduce((sum, f) => sum + Number(f.sale_price), 0) ?? 0;
  const beneficioTotal = financials?.reduce((sum, f) => sum + Number(f.profit), 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <SignOutButton />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="card text-center">
          <p className="text-xl font-bold">{totalProfesionales}</p>
          <p className="text-xs text-neutral-500">Profesionales</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold">{totalSolicitudes}</p>
          <p className="text-xs text-neutral-500">Solicitudes</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold">{totalCompletados}</p>
          <p className="text-xs text-neutral-500">Completados</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold">{formatCurrency(facturacionTotal)}</p>
          <p className="text-xs text-neutral-500">Facturación total</p>
        </div>
        <div className="card text-center">
          <p className="text-xl font-bold">{formatCurrency(beneficioTotal)}</p>
          <p className="text-xs text-neutral-500">Beneficio total</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Profesionales</h2>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Negocio</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Registro</th>
              <th className="px-4 py-2">Trabajos</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 font-medium">{b.name}</td>
                <td className="px-4 py-2">{b.phone}</td>
                <td className="px-4 py-2">{b.email}</td>
                <td className="px-4 py-2">{formatDateTime(b.created_at)}</td>
                <td className="px-4 py-2">{b.jobs.filter((j) => j.submitted_at).length}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {b.approved ? "Aprobado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <ApproveBusinessButton businessId={b.id} approved={b.approved} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
