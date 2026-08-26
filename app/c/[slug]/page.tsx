import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientChat from "@/components/ClientChat";

export default async function PublicClientPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, description, zone")
    .eq("slug", params.slug)
    .single();

  if (!business) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <ClientChat slug={params.slug} businessName={business.name} businessDescription={business.description} businessZone={business.zone} />
    </main>
  );
}
