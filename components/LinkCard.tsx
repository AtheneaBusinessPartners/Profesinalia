"use client";

import { useEffect, useState } from "react";

export default function LinkCard({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/c/${slug}`;
  const shareText = `Hola, para poder ayudarte mejor necesito algunos datos sobre el trabajo. Entra aquí y cuéntame qué necesitas:\n\n${link}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card">
      <p className="text-sm font-semibold text-neutral-500">Tu enlace</p>
      <p className="mt-1 break-all font-mono text-sm text-brand-700">{link || "cargando..."}</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={handleCopy} className="btn-secondary !px-2 !py-2 text-xs">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary !px-2 !py-2 text-xs"
        >
          WhatsApp
        </a>
        <a href={`/c/${slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-2 !py-2 text-xs">
          Probar
        </a>
      </div>
    </div>
  );
}
