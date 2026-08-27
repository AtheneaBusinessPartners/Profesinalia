export type Trade = "aire_acondicionado" | "electricista" | "fontanero" | "pintor";

export const TRADE_LABELS: Record<Trade, string> = {
  aire_acondicionado: "Aire acondicionado",
  electricista: "Electricista",
  fontanero: "Fontanero",
  pintor: "Pintor",
};

export const TRADE_DEFAULT_DESCRIPTIONS: Record<Trade, string> = {
  aire_acondicionado: "Instalación y reparación de aire acondicionado.",
  electricista: "Instalaciones y averías eléctricas.",
  fontanero: "Fontanería: averías, atascos e instalaciones.",
  pintor: "Pintura de interiores y exteriores.",
};

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: "select" | "text" | "number" | "textarea";
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
}

export interface JobTypeOption {
  value: string;
  label: string;
  emoji: string;
}

const FECHA_OPTIONS: FieldOption[] = [
  { value: "Lo antes posible", label: "Lo antes posible" },
  { value: "En 1-2 semanas", label: "En 1-2 semanas" },
  { value: "En 1 mes", label: "En 1 mes" },
  { value: "Sin prisa", label: "Sin prisa" },
];

const VIVIENDA_OPTIONS: FieldOption[] = [
  { value: "Piso", label: "Piso" },
  { value: "Chalet", label: "Chalet / unifamiliar" },
  { value: "Local comercial", label: "Local comercial" },
  { value: "Oficina", label: "Oficina" },
  { value: "Otro", label: "Otro" },
];

const MARCA_AC_OPTIONS: FieldOption[] = [
  { value: "Sin preferencia", label: "Sin preferencia" },
  { value: "Mitsubishi Electric", label: "Mitsubishi Electric" },
  { value: "Daikin", label: "Daikin" },
  { value: "LG", label: "LG" },
  { value: "Samsung", label: "Samsung" },
  { value: "Fujitsu", label: "Fujitsu" },
  { value: "Panasonic", label: "Panasonic" },
  { value: "Otra", label: "Otra" },
  { value: "No lo sé", label: "No lo sé" },
];

export const JOB_TYPES_BY_TRADE: Record<Trade, JobTypeOption[]> = {
  aire_acondicionado: [
    { value: "instalacion", label: "Instalar aire acondicionado", emoji: "❄️" },
    { value: "reparacion", label: "Reparar una avería", emoji: "🔧" },
    { value: "mantenimiento", label: "Mantenimiento / revisión", emoji: "🧰" },
  ],
  electricista: [
    { value: "averia", label: "Avería eléctrica", emoji: "🔌" },
    { value: "instalacion_nueva", label: "Instalación nueva", emoji: "💡" },
    { value: "cuadro_electrico", label: "Cuadro eléctrico", emoji: "⚡" },
    { value: "domotica", label: "Domótica / automatización", emoji: "🏠" },
  ],
  fontanero: [
    { value: "fuga", label: "Fuga de agua", emoji: "💧" },
    { value: "atasco", label: "Atasco / desagüe", emoji: "🚿" },
    { value: "instalacion_nueva", label: "Instalación nueva", emoji: "🔧" },
    { value: "calentador", label: "Calentador / caldera", emoji: "🔥" },
  ],
  pintor: [
    { value: "interior", label: "Pintura interior", emoji: "🎨" },
    { value: "exterior", label: "Pintura exterior / fachada", emoji: "🏚️" },
    { value: "reparacion_pared", label: "Reparación de pared / gotelé", emoji: "🧱" },
  ],
};

export const FIELDS_BY_TRADE: Record<Trade, Record<string, FieldDef[]>> = {
  aire_acondicionado: {
    instalacion: [
      { key: "tipo_vivienda", label: "Tipo de vivienda", type: "select", required: true, options: VIVIENDA_OPTIONS },
      {
        key: "estancia",
        label: "¿Dónde quieres instalarlo?",
        type: "select",
        required: true,
        options: [
          { value: "Salón", label: "Salón" },
          { value: "Dormitorio", label: "Dormitorio" },
          { value: "Cocina", label: "Cocina" },
          { value: "Toda la vivienda", label: "Toda la vivienda" },
          { value: "Varias estancias", label: "Varias estancias" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "metros_cuadrados_estancia", label: "Metros cuadrados aproximados de esa zona", type: "number", placeholder: "Ej. 25" },
      {
        key: "preinstalacion",
        label: "¿Tienes preinstalación (tubos ya preparados)?",
        type: "select",
        options: [
          { value: "Sí", label: "Sí" },
          { value: "No", label: "No" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
      {
        key: "equipo_actual",
        label: "¿Ya tienes algún equipo instalado ahí?",
        type: "select",
        options: [
          { value: "No", label: "No, es la primera instalación" },
          { value: "Sí, pero no funciona bien", label: "Sí, pero no funciona bien" },
          { value: "Sí, quiero sustituirlo", label: "Sí, quiero sustituirlo" },
        ],
      },
      { key: "marca_preferida", label: "Marca preferida", type: "select", options: MARCA_AC_OPTIONS },
      { key: "fecha_deseada", label: "¿Para cuándo lo necesitas?", type: "select", options: FECHA_OPTIONS },
    ],
    reparacion: [
      {
        key: "problema",
        label: "¿Qué problema tiene?",
        type: "select",
        required: true,
        options: [
          { value: "No enfría", label: "No enfría" },
          { value: "No calienta", label: "No calienta" },
          { value: "Hace ruido raro", label: "Hace ruido raro" },
          { value: "Gotea agua", label: "Gotea agua" },
          { value: "Muestra un código de error", label: "Muestra un código de error" },
          { value: "No enciende", label: "No enciende" },
          { value: "Otro", label: "Otro" },
        ],
      },
      {
        key: "desde_cuando",
        label: "¿Desde cuándo pasa?",
        type: "select",
        options: [
          { value: "Desde hoy", label: "Desde hoy" },
          { value: "Esta semana", label: "Esta semana" },
          { value: "Hace más de una semana", label: "Hace más de una semana" },
          { value: "No lo recuerdo", label: "No lo recuerdo" },
        ],
      },
      { key: "marca", label: "Marca del equipo", type: "select", options: MARCA_AC_OPTIONS },
      { key: "modelo", label: "Modelo (si lo sabes)", type: "text", placeholder: "Opcional" },
      { key: "codigo_error", label: "Código de error (si aparece alguno)", type: "text", placeholder: "Opcional" },
      { key: "numero_equipos_afectados", label: "Número de equipos afectados", type: "number", placeholder: "Ej. 1" },
    ],
    mantenimiento: [
      {
        key: "tipo_equipo",
        label: "Tipo de equipo",
        type: "select",
        required: true,
        options: [
          { value: "Split de pared", label: "Split de pared" },
          { value: "Por conductos", label: "Por conductos" },
          { value: "Cassette de techo", label: "Cassette de techo" },
          { value: "Multisplit (varias unidades)", label: "Multisplit (varias unidades)" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "numero_equipos", label: "Número de unidades", type: "number", placeholder: "Ej. 2" },
      { key: "marca", label: "Marca / modelo (si lo sabes)", type: "text", placeholder: "Opcional" },
      {
        key: "ultimo_mantenimiento",
        label: "¿Cuándo fue el último mantenimiento?",
        type: "select",
        options: [
          { value: "Nunca se ha hecho", label: "Nunca se ha hecho" },
          { value: "Hace menos de 1 año", label: "Hace menos de 1 año" },
          { value: "Hace más de 1 año", label: "Hace más de 1 año" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
      {
        key: "problemas_actuales",
        label: "¿Notas algún problema ahora mismo?",
        type: "select",
        options: [
          { value: "No, es revisión rutinaria", label: "No, es revisión rutinaria" },
          { value: "Sí", label: "Sí" },
        ],
      },
    ],
  },

  electricista: {
    averia: [
      {
        key: "problema",
        label: "¿Qué problema tiene?",
        type: "select",
        required: true,
        options: [
          { value: "No hay luz en toda la casa", label: "No hay luz en toda la casa" },
          { value: "No hay luz en una zona", label: "No hay luz en una zona" },
          { value: "Salta el diferencial", label: "Salta el diferencial" },
          { value: "Enchufe o interruptor no funciona", label: "Enchufe o interruptor no funciona" },
          { value: "Chispas o olor a quemado", label: "Chispas o olor a quemado" },
          { value: "Otro", label: "Otro" },
        ],
      },
      {
        key: "desde_cuando",
        label: "¿Desde cuándo pasa?",
        type: "select",
        options: [
          { value: "Desde hoy", label: "Desde hoy" },
          { value: "Esta semana", label: "Esta semana" },
          { value: "Hace más de una semana", label: "Hace más de una semana" },
          { value: "No lo recuerdo", label: "No lo recuerdo" },
        ],
      },
      { key: "zona_afectada", label: "¿Qué zona de la casa?", type: "text", placeholder: "Opcional" },
      {
        key: "urgencia",
        label: "¿Cómo de urgente es?",
        type: "select",
        options: [
          { value: "Es urgente, puede ser peligroso", label: "Es urgente, puede ser peligroso" },
          { value: "Puede esperar unos días", label: "Puede esperar unos días" },
          { value: "Sin prisa", label: "Sin prisa" },
        ],
      },
    ],
    instalacion_nueva: [
      {
        key: "tipo_instalacion",
        label: "¿Qué tipo de instalación necesitas?",
        type: "select",
        required: true,
        options: [
          { value: "Vivienda nueva", label: "Vivienda nueva" },
          { value: "Reforma", label: "Reforma" },
          { value: "Ampliar puntos de luz", label: "Ampliar puntos de luz" },
          { value: "Cambiar instalación antigua", label: "Cambiar instalación antigua" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "tipo_vivienda", label: "Tipo de vivienda", type: "select", options: VIVIENDA_OPTIONS },
      { key: "numero_estancias", label: "¿Cuántas estancias?", type: "number", placeholder: "Ej. 4" },
      { key: "fecha_deseada", label: "¿Para cuándo lo necesitas?", type: "select", options: FECHA_OPTIONS },
    ],
    cuadro_electrico: [
      {
        key: "motivo",
        label: "¿Por qué necesitas tocar el cuadro eléctrico?",
        type: "select",
        required: true,
        options: [
          { value: "Ampliar potencia", label: "Ampliar potencia" },
          { value: "Cuadro obsoleto", label: "Cuadro obsoleto" },
          { value: "Boletín eléctrico (CIE)", label: "Boletín eléctrico (CIE)" },
          { value: "No cumple normativa", label: "No cumple normativa" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "potencia_actual", label: "¿Sabes la potencia contratada?", type: "text", placeholder: "Opcional" },
      {
        key: "antiguedad_vivienda",
        label: "¿Qué antigüedad tiene la vivienda?",
        type: "select",
        options: [
          { value: "Menos de 10 años", label: "Menos de 10 años" },
          { value: "Entre 10 y 30 años", label: "Entre 10 y 30 años" },
          { value: "Más de 30 años", label: "Más de 30 años" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
    ],
    domotica: [
      {
        key: "interes",
        label: "¿Qué te interesa automatizar?",
        type: "select",
        required: true,
        options: [
          { value: "Iluminación inteligente", label: "Iluminación inteligente" },
          { value: "Persianas automatizadas", label: "Persianas automatizadas" },
          { value: "Control de climatización", label: "Control de climatización" },
          { value: "Seguridad / cámaras", label: "Seguridad / cámaras" },
          { value: "Instalación completa", label: "Instalación completa" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "tipo_vivienda", label: "Tipo de vivienda", type: "select", options: VIVIENDA_OPTIONS },
      { key: "fecha_deseada", label: "¿Para cuándo lo necesitas?", type: "select", options: FECHA_OPTIONS },
    ],
  },

  fontanero: {
    fuga: [
      {
        key: "ubicacion_fuga",
        label: "¿Dónde está la fuga?",
        type: "select",
        required: true,
        options: [
          { value: "Baño", label: "Baño" },
          { value: "Cocina", label: "Cocina" },
          { value: "Bajo el fregadero", label: "Bajo el fregadero" },
          { value: "Tubería vista", label: "Tubería vista" },
          { value: "No lo sé exactamente", label: "No lo sé exactamente" },
          { value: "Otro", label: "Otro" },
        ],
      },
      {
        key: "gravedad",
        label: "¿Cómo de grave es?",
        type: "select",
        options: [
          { value: "Gotea poco", label: "Gotea poco" },
          { value: "Gotea bastante", label: "Gotea bastante" },
          { value: "Sale mucha agua, es urgente", label: "Sale mucha agua, es urgente" },
        ],
      },
      {
        key: "desde_cuando",
        label: "¿Desde cuándo pasa?",
        type: "select",
        options: [
          { value: "Desde hoy", label: "Desde hoy" },
          { value: "Esta semana", label: "Esta semana" },
          { value: "Hace más de una semana", label: "Hace más de una semana" },
        ],
      },
    ],
    atasco: [
      {
        key: "ubicacion_atasco",
        label: "¿Dónde está el atasco?",
        type: "select",
        required: true,
        options: [
          { value: "Inodoro", label: "Inodoro" },
          { value: "Fregadero", label: "Fregadero" },
          { value: "Ducha o bañera", label: "Ducha o bañera" },
          { value: "Desagüe general", label: "Desagüe general" },
          { value: "Otro", label: "Otro" },
        ],
      },
      {
        key: "gravedad",
        label: "¿Cómo de atascado está?",
        type: "select",
        options: [
          { value: "No baja nada de agua", label: "No baja nada de agua" },
          { value: "Baja muy lento", label: "Baja muy lento" },
          { value: "Solo huele mal", label: "Solo huele mal" },
        ],
      },
    ],
    instalacion_nueva: [
      {
        key: "tipo_instalacion",
        label: "¿Qué necesitas instalar?",
        type: "select",
        required: true,
        options: [
          { value: "Baño nuevo", label: "Baño nuevo" },
          { value: "Cocina nueva", label: "Cocina nueva" },
          { value: "Cambiar grifería", label: "Cambiar grifería" },
          { value: "Cambiar tuberías", label: "Cambiar tuberías" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "tipo_vivienda", label: "Tipo de vivienda", type: "select", options: VIVIENDA_OPTIONS },
      { key: "fecha_deseada", label: "¿Para cuándo lo necesitas?", type: "select", options: FECHA_OPTIONS },
    ],
    calentador: [
      {
        key: "tipo_equipo",
        label: "¿Qué tipo de equipo es?",
        type: "select",
        required: true,
        options: [
          { value: "Termo eléctrico", label: "Termo eléctrico" },
          { value: "Caldera de gas", label: "Caldera de gas" },
          { value: "Caldera de gasoil", label: "Caldera de gasoil" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
      {
        key: "problema",
        label: "¿Qué le pasa?",
        type: "select",
        options: [
          { value: "No calienta", label: "No calienta" },
          { value: "Hace ruido", label: "Hace ruido" },
          { value: "Pierde agua", label: "Pierde agua" },
          { value: "Quiero instalar uno nuevo", label: "Quiero instalar uno nuevo" },
          { value: "Otro", label: "Otro" },
        ],
      },
      {
        key: "antiguedad_equipo",
        label: "¿Qué antigüedad tiene el equipo?",
        type: "select",
        options: [
          { value: "Menos de 5 años", label: "Menos de 5 años" },
          { value: "Más de 5 años", label: "Más de 5 años" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
    ],
  },

  pintor: {
    interior: [
      {
        key: "estancias",
        label: "¿Qué quieres pintar?",
        type: "select",
        required: true,
        options: [
          { value: "Una habitación", label: "Una habitación" },
          { value: "Varias habitaciones", label: "Varias habitaciones" },
          { value: "Vivienda completa", label: "Vivienda completa" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "metros_cuadrados", label: "Metros cuadrados aproximados", type: "number", placeholder: "Ej. 60" },
      {
        key: "estado_pared",
        label: "¿En qué estado está la pared?",
        type: "select",
        options: [
          { value: "Buen estado, solo repintar", label: "Buen estado, solo repintar" },
          { value: "Hay grietas o desperfectos", label: "Hay grietas o desperfectos" },
          { value: "Tiene gotelé y quiero quitarlo", label: "Tiene gotelé y quiero quitarlo" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
      { key: "fecha_deseada", label: "¿Para cuándo lo necesitas?", type: "select", options: FECHA_OPTIONS },
    ],
    exterior: [
      {
        key: "tipo_superficie",
        label: "¿Qué superficie es?",
        type: "select",
        required: true,
        options: [
          { value: "Fachada", label: "Fachada" },
          { value: "Terraza o balcón", label: "Terraza o balcón" },
          { value: "Vallas o rejas", label: "Vallas o rejas" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "metros_cuadrados", label: "Metros cuadrados aproximados", type: "number", placeholder: "Opcional" },
      {
        key: "altura",
        label: "¿Hace falta acceder en altura?",
        type: "select",
        options: [
          { value: "Planta baja", label: "Planta baja" },
          { value: "Necesita andamio o elevador", label: "Necesita andamio o elevador" },
          { value: "No lo sé", label: "No lo sé" },
        ],
      },
    ],
    reparacion_pared: [
      {
        key: "problema",
        label: "¿Qué problema tiene la pared?",
        type: "select",
        required: true,
        options: [
          { value: "Grietas", label: "Grietas" },
          { value: "Humedades", label: "Humedades" },
          { value: "Gotelé a quitar", label: "Gotelé a quitar" },
          { value: "Desconchones", label: "Desconchones" },
          { value: "Otro", label: "Otro" },
        ],
      },
      { key: "zona", label: "¿En qué estancia?", type: "text", placeholder: "Opcional" },
    ],
  },
};

export function jobTypeLabelFor(trade: Trade, type: string): string {
  return JOB_TYPES_BY_TRADE[trade]?.find((t) => t.value === type)?.label ?? "Solicitud";
}

export function buildSummary(
  trade: Trade,
  type: string,
  city: string,
  data: Record<string, string>
): string {
  const typeLabel = jobTypeLabelFor(trade, type);
  const fieldDefs = FIELDS_BY_TRADE[trade]?.[type] ?? [];

  const parts: string[] = [`Cliente interesado en: ${typeLabel}${city ? ` (${city})` : ""}.`];

  for (const field of fieldDefs) {
    const value = data[field.key];
    if (value && !(field.key === "marca_preferida" && value === "Sin preferencia")) {
      parts.push(`${field.label.replace(/^¿|\?$/g, "")}: ${value}.`);
    }
  }

  return parts.join(" ");
}
