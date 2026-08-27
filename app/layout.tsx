import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profesionalia",
  description:
    "Convierte un WhatsApp en un trabajo organizado: tu cliente rellena un formulario guiado, tú lo recibes listo para presupuestar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
