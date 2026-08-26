"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/trabajos", label: "Trabajos", icon: "🧰" },
  { href: "/dashboard/clientes", label: "Clientes", icon: "👤" },
  { href: "/dashboard/perfil", label: "Perfil", icon: "⚙️" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                active ? "text-brand-600" : "text-neutral-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
