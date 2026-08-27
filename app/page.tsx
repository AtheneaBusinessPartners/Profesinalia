import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white">
          ❄️
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">ClimaAssist</h1>
        <p className="mt-2 text-neutral-600">
          Recibes un WhatsApp. Mandas un enlace. El cliente cuenta lo que necesita. Tú lo recibes
          organizado en tu panel, listo para presupuestar.
        </p>
      </div>

      <div className="card flex flex-col gap-3 text-sm text-neutral-600">
        <p>1. El cliente te escribe por WhatsApp pidiendo presupuesto.</p>
        <p>2. Le mandas tu enlace: climaassist.com/c/tu-negocio</p>
        <p>3. Rellena un formulario guiado con lo que necesita y sube fotos.</p>
        <p>4. Tú abres tu panel y ves el trabajo completo, listo para valorar.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/registro" className="btn-primary">
          Crear mi cuenta de profesional
        </Link>
        <Link href="/login" className="btn-secondary">
          Ya tengo cuenta — Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
