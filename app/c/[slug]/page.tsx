import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobRequestForm from "@/components/JobRequestForm";

export default async function PublicClientPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, description, zone, approved")
    .eq("slug", params.slug)
    .single();

  if (!business) {
    notFound();
  }

  if (!business.approved) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-3 text-4xl">🕓</div>
        <h1 className="text-lg font-semibold">Este enlace todavía no está activo</h1>
        <p className="mt-2 text-neutral-600">
          {business.name} está terminando de configurar su cuenta. Vuelve a intentarlo un poco más
          tarde.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <JobRequestForm slug={params.slug} businessName={business.name} businessDescription={business.description} businessZone={business.zone} />
    </main>
  );
}
