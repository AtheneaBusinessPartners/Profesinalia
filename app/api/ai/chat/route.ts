import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Cliente Supabase "plano" (sin cookies): esta ruta habla con visitantes anónimos,
// la seguridad la imponen las funciones security definer validando conversation_id + token,
// igual que si llamara el propio navegador con la anon key.
function createAnonClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const SAVE_JOB_TOOL = {
  name: "guardar_informacion_trabajo",
  description:
    "Guarda o actualiza la información del trabajo recopilada hasta ahora. Llámala cada vez que el cliente aporte un dato nuevo relevante, aunque la conversación no haya terminado. Marca completado=true solo cuando ya tienes información suficiente para que el profesional pueda valorar el trabajo sin tener que volver a preguntar lo básico.",
  input_schema: {
    type: "object" as const,
    properties: {
      tipo_trabajo: {
        type: "string",
        enum: ["instalacion", "reparacion", "mantenimiento", "otro"],
        description: "Tipo de trabajo solicitado.",
      },
      descripcion: {
        type: "string",
        description: "Descripción corta y clara del trabajo, en una frase.",
      },
      ciudad: { type: "string", description: "Localidad o ciudad de la vivienda." },
      direccion: { type: "string", description: "Dirección exacta, solo si el cliente la ha dado." },
      codigo_postal: { type: "string" },
      datos: {
        type: "object",
        description:
          "Resto de campos técnicos recopilados, como pares clave-valor en español. Ejemplos de claves según el tipo de trabajo: tipo_vivienda, estancia, metros_cuadrados_estancia, metros_cuadrados_vivienda, numero_estancias, orientacion, preinstalacion, equipo_actual, ubicacion_unidad_exterior, marca_preferida, fecha_deseada, problema, desde_cuando, sintomas, marca, modelo, codigo_error, numero_equipos_afectados, ultimo_mantenimiento. Incluye solo las claves que conozcas.",
      },
      resumen: {
        type: "string",
        description:
          "Resumen claro y útil para el profesional, de 2 a 4 frases, en tercera persona, con los datos concretos recopilados.",
      },
      completado: {
        type: "boolean",
        description: "true cuando ya hay información suficiente para cerrar la conversación.",
      },
    },
    required: ["completado"],
  },
};

const SYSTEM_PROMPT = (businessName: string, customerFirstName: string) => `Eres la secretaria virtual de ${businessName}, un profesional de instalación, reparación y mantenimiento de aire acondicionado. Estás hablando por chat con ${customerFirstName}, un cliente potencial que ha llegado desde un enlace de WhatsApp.

Tu objetivo: recopilar la información necesaria para que ${businessName} pueda valorar el trabajo sin tener que volver a preguntar nada básico, con la mínima fricción posible para el cliente.

Reglas de conversación:
- Habla en español, cercano y profesional, en frases cortas. Nada de tecnicismos innecesarios.
- NO hagas un interrogatorio de preguntas fijas una detrás de otra. Lee bien lo que dice el cliente: si en una respuesta ya da varios datos a la vez (tipo de vivienda, metros, orientación, zona...), no vuelvas a preguntar por ellos.
- Haz UNA pregunta a la vez (como mucho dos si están muy relacionadas), la que tenga más sentido a continuación según lo que ya sabes.
- Adapta las preguntas al tipo de trabajo:
  * Instalación: tipo de vivienda, estancia y sus metros cuadrados, si hay preinstalación, si hay equipo actual, posible ubicación de la unidad exterior, marca preferida (si tiene), fecha deseada, fotos del espacio.
  * Reparación: qué problema tiene, desde cuándo, síntomas, marca/modelo si lo sabe, código de error si lo hay, número de equipos afectados, fotos del equipo o del error.
  * Mantenimiento: tipo y número de equipos, marca/modelo, cuándo fue el último mantenimiento, problemas actuales, fotos.
- No es necesario obtener todos los campos posibles: solo los relevantes para poder valorar el trabajo.
- Pide fotografías cuando aporten valor (instalaciones, averías, equipos existentes), recordando que hay un botón para subirlas.
- Después de cada mensaje del cliente, llama a la herramienta guardar_informacion_trabajo con los datos que hayas extraído hasta el momento (acumulativo, no hace falta repetir lo que no ha cambiado).
- Cuando ya tengas información suficiente, despídete con un mensaje breve y cálido confirmando que la solicitud se ha enviado al profesional y que se pondrá en contacto en breve, y llama a la herramienta con completado=true.
- No preguntes ni menciones precios, presupuestos exactos ni tarifas: eso lo decide el profesional.`;

interface ChatMessage {
  sender: "customer" | "ai";
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, token, message } = body as {
      conversationId: string;
      token: string;
      message: string;
    };

    if (!conversationId || !token || !message) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const supabase = createAnonClient();

    const { error: storeError } = await supabase.rpc("post_customer_message", {
      p_conversation_id: conversationId,
      p_token: token,
      p_content: message,
    });
    if (storeError) throw storeError;

    const { data: history, error: historyError } = await supabase.rpc("get_conversation_messages", {
      p_conversation_id: conversationId,
      p_token: token,
    });
    if (historyError) throw historyError;

    const { data: jobRows } = await supabase
      .from("jobs")
      .select("business_id")
      .eq("conversation_id", conversationId)
      .limit(1);

    const businessId = jobRows?.[0]?.business_id;
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single();

    const { data: convo } = await supabase
      .from("conversations")
      .select("customer_id")
      .eq("id", conversationId)
      .single();

    const { data: customer } = await supabase
      .from("customers")
      .select("name")
      .eq("id", convo?.customer_id)
      .single();

    const customerFirstName = (customer?.name ?? "").split(" ")[0] || "el cliente";
    const businessName = business?.name ?? "el profesional";

    const anthropicMessages = (history as ChatMessage[]).map((m) => ({
      role: m.sender === "customer" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    // Salvaguarda: si la conversación se alarga demasiado, forzar cierre en el próximo turno.
    const forceClose = anthropicMessages.length > 40;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      system:
        SYSTEM_PROMPT(businessName, customerFirstName) +
        (forceClose
          ? "\n\nIMPORTANTE: la conversación ya es muy larga. Cierra ahora mismo con la información que tengas, llamando a la herramienta con completado=true."
          : ""),
      tools: [SAVE_JOB_TOOL],
      messages: anthropicMessages,
    });

    let replyText = "";
    let done = false;

    for (const block of response.content) {
      if (block.type === "text") {
        replyText += block.text;
      } else if (block.type === "tool_use" && block.name === "guardar_informacion_trabajo") {
        const input = block.input as {
          tipo_trabajo?: string;
          descripcion?: string;
          ciudad?: string;
          direccion?: string;
          codigo_postal?: string;
          datos?: Record<string, unknown>;
          resumen?: string;
          completado?: boolean;
        };

        done = Boolean(input.completado);

        await supabase.rpc("update_job_from_ai", {
          p_conversation_id: conversationId,
          p_token: token,
          p_type: input.tipo_trabajo ?? null,
          p_description: input.descripcion ?? null,
          p_city: input.ciudad ?? null,
          p_address: input.direccion ?? null,
          p_postal_code: input.codigo_postal ?? null,
          p_data: input.datos ?? {},
          p_ai_summary: input.resumen ?? null,
          p_complete: done,
        });
      }
    }

    if (!replyText.trim()) {
      replyText = done
        ? "¡Perfecto! Ya tengo toda la información. Se la he enviado, se pondrá en contacto contigo en breve."
        : "Entendido, cuéntame algo más.";
    }

    const { error: aiMsgError } = await supabase.rpc("post_ai_message", {
      p_conversation_id: conversationId,
      p_token: token,
      p_content: replyText,
    });
    if (aiMsgError) throw aiMsgError;

    return NextResponse.json({ reply: replyText, done });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "chat_failed" }, { status: 500 });
  }
}
