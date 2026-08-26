"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  slug: string;
  businessName: string;
  businessDescription: string;
  businessZone: string;
}

interface ChatMessage {
  sender: "customer" | "ai";
  content: string;
}

interface SessionInfo {
  conversationId: string;
  token: string;
}

function storageKey(slug: string) {
  return `climaassist_session_${slug}`;
}

export default function ClientChat({ slug, businessName, businessDescription, businessZone }: Props) {
  const supabase = createClient();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (raw) {
      const parsed: SessionInfo = JSON.parse(raw);
      setSession(parsed);
      loadHistory(parsed);
    } else {
      setRestoring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function loadHistory(s: SessionInfo) {
    const { data } = await supabase.rpc("get_conversation_messages", {
      p_conversation_id: s.conversationId,
      p_token: s.token,
    });
    if (data) setMessages(data as ChatMessage[]);
    setRestoring(false);
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setStartLoading(true);

    const { data, error } = await supabase.rpc("start_conversation", {
      p_slug: slug,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
    });

    if (error || !data || data.length === 0) {
      setStartError("No se ha podido iniciar la conversación. Inténtalo de nuevo.");
      setStartLoading(false);
      return;
    }

    const row = data[0];
    const info: SessionInfo = { conversationId: row.conversation_id, token: row.token };
    sessionStorage.setItem(storageKey(slug), JSON.stringify(info));
    setSession(info);
    await loadHistory(info);
    setStartLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "customer", content: text }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: session.conversationId, token: session.token, message: text }),
      });
      const json = await res.json();
      if (json.reply) {
        setMessages((prev) => [...prev, { sender: "ai", content: json.reply }]);
      }
      if (json.done) setDone(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", content: "Ha habido un problema de conexión. ¿Puedes repetir tu último mensaje?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);

    try {
      const path = `${session.conversationId}/${session.token}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("job-photos").getPublicUrl(path);
      await supabase.rpc("register_job_photo", {
        p_conversation_id: session.conversationId,
        p_token: session.token,
        p_url: publicUrl.publicUrl,
      });

      setPhotos((prev) => [...prev, publicUrl.publicUrl]);
    } catch {
      setStartError(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (restoring) return null;

  if (!session) {
    return (
      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl text-white">
            ❄️
          </div>
          <h1 className="text-xl font-bold">{businessName}</h1>
          <p className="mt-1 text-neutral-600">{businessDescription}</p>
          {businessZone && <p className="text-sm text-neutral-400">{businessZone}</p>}
        </div>

        <h2 className="mb-4 text-center text-lg font-semibold">Vamos a preparar tu solicitud</h2>

        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <div>
            <label className="label">¿Cómo te llamas?</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">¿Cuál es tu teléfono?</label>
            <input
              className="input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {startError && <p className="text-sm text-red-600">{startError}</p>}
          <button type="submit" className="btn-primary" disabled={startLoading}>
            {startLoading ? "Cargando..." : "Continuar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-neutral-200 px-4 py-3 text-center">
        <p className="font-semibold">{businessName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.sender === "customer" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm text-neutral-400">Escribiendo...</div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Foto enviada" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {done ? (
        <div className="border-t border-neutral-200 bg-emerald-50 px-4 py-4 text-center text-sm text-emerald-800">
          ✅ Tu solicitud se ha enviado. {businessName} se pondrá en contacto contigo en breve.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-200 px-3 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhoto}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-300 text-lg"
            aria-label="Añadir fotografía"
          >
            {uploading ? "…" : "📷"}
          </button>
          <input
            className="input"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-50"
            disabled={sending || !input.trim()}
            aria-label="Enviar"
          >
            ➤
          </button>
        </form>
      )}
    </div>
  );
}
