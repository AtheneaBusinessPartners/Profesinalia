import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import LinkCard from "@/components/LinkCard";
import ProfileForm from "@/components/ProfileForm";
import SignOutButton from "@/components/SignOutButton";

export default async function PerfilPage() {
  const business = await getCurrentBusinessOrRedirect();

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Perfil</h1>

      <div className="mb-6">
        <LinkCard slug={business.slug} />
      </div>

      <section className="card">
        <p className="mb-3 text-sm font-semibold text-neutral-500">Datos del negocio</p>
        <ProfileForm business={business} />
      </section>

      <div className="mt-6 text-center">
        <SignOutButton />
      </div>
    </div>
  );
}
