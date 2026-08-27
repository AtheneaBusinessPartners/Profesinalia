import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import DashboardNav from "@/components/DashboardNav";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusinessOrRedirect();

  if (!business.approved) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 text-4xl">🕓</div>
        <h1 className="text-lg font-semibold">Tu cuenta está pendiente de aprobación</h1>
        <p className="mt-2 text-neutral-600">
          Hemos recibido el registro de <strong>{business.name}</strong>. En cuanto la revisemos,
          tu enlace y tu panel se activarán automáticamente.
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-20">
      {children}
      <DashboardNav />
    </div>
  );
}
