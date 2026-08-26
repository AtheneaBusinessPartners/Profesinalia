import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimaAssist",
  description:
    "El asistente que convierte un WhatsApp en un trabajo organizado: tu cliente cuenta lo que necesita, tú lo recibes listo para presupuestar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
