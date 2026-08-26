import { getCurrentBusinessOrRedirect } from "@/lib/get-business";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await getCurrentBusinessOrRedirect();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-50 pb-20">
      {children}
      <DashboardNav />
    </div>
  );
}
