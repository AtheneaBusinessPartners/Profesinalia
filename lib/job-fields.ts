export type JobType = "instalacion" | "reparacion" | "mantenimiento";

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

export const JOB_TYPE_OPTIONS: { value: JobType; label: string; emoji: string }[] = [
  { value: "instalacion", label: "Instalar aire acondicionado", emoji: "❄️" },
  { value: "reparacion", label: "Reparar una avería", emoji: "🔧" },
  { value: "mantenimiento", label: "Mantenimiento / revisión", emoji: "🧰" },
];

const FECHA_OPTIONS: FieldOption[] = [
  { value: "Lo antes posible", label: "Lo antes posible" },
  { value: "En 1-2 semanas", label: "En 1-2 semanas" },
  { value: "En 1 mes", label: "En 1 mes" },
  { value: "Sin prisa", label: "Sin prisa" },
];

const MARCA_OPTIONS: FieldOption[] = [
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

export const FIELDS_BY_TYPE: Record<JobType, FieldDef[]> = {
  instalacion: [
    {
      key: "tipo_vivienda",
      label: "Tipo de vivienda",
      type: "select",
      required: true,
      options: [
        { value: "Piso", label: "Piso" },
        { value: "Chalet", label: "Chalet / unifamiliar" },
        { value: "Local comercial", label: "Local comercial" },
        { value: "Oficina", label: "Oficina" },
        { value: "Otro", label: "Otro" },
      ],
    },
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
    {
      key: "metros_cuadrados_estancia",
      label: "Metros cuadrados aproximados de esa zona",
      type: "number",
      placeholder: "Ej. 25",
    },
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
    {
      key: "marca_preferida",
      label: "Marca preferida",
      type: "select",
      options: MARCA_OPTIONS,
    },
    {
      key: "fecha_deseada",
      label: "¿Para cuándo lo necesitas?",
      type: "select",
      options: FECHA_OPTIONS,
    },
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
    {
      key: "marca",
      label: "Marca del equipo",
      type: "select",
      options: MARCA_OPTIONS,
    },
    {
      key: "modelo",
      label: "Modelo (si lo sabes)",
      type: "text",
      placeholder: "Opcional",
    },
    {
      key: "codigo_error",
      label: "Código de error (si aparece alguno)",
      type: "text",
      placeholder: "Opcional",
    },
    {
      key: "numero_equipos_afectados",
      label: "Número de equipos afectados",
      type: "number",
      placeholder: "Ej. 1",
    },
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
    {
      key: "numero_equipos",
      label: "Número de unidades",
      type: "number",
      placeholder: "Ej. 2",
    },
    {
      key: "marca",
      label: "Marca / modelo (si lo sabes)",
      type: "text",
      placeholder: "Opcional",
    },
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
};

export function buildSummary(
  type: JobType,
  city: string,
  data: Record<string, string>
): string {
  const parts: string[] = [];

  if (type === "instalacion") {
    const estancia = data.estancia || "una estancia";
    const metros = data.metros_cuadrados_estancia ? `de ${data.metros_cuadrados_estancia} m² ` : "";
    const vivienda = data.tipo_vivienda ? `en un/a ${data.tipo_vivienda.toLowerCase()}` : "en una vivienda";
    parts.push(
      `Cliente interesado en instalar aire acondicionado en ${estancia.toLowerCase()} ${metros}${vivienda}${
        city ? ` situado en ${city}` : ""
      }.`
    );
    if (data.preinstalacion) parts.push(`Preinstalación: ${data.preinstalacion}.`);
    if (data.equipo_actual) parts.push(`Equipo actual: ${data.equipo_actual}.`);
    if (data.marca_preferida && data.marca_preferida !== "Sin preferencia")
      parts.push(`Marca preferida: ${data.marca_preferida}.`);
    if (data.fecha_deseada) parts.push(`Fecha deseada: ${data.fecha_deseada}.`);
  } else if (type === "reparacion") {
    parts.push(
      `Avería reportada${city ? ` en ${city}` : ""}: ${data.problema || "no especifica el problema"}.`
    );
    if (data.desde_cuando) parts.push(`Ocurre desde: ${data.desde_cuando}.`);
    if (data.marca) parts.push(`Marca: ${data.marca}${data.modelo ? ` (modelo ${data.modelo})` : ""}.`);
    if (data.codigo_error) parts.push(`Código de error: ${data.codigo_error}.`);
    if (data.numero_equipos_afectados) parts.push(`Equipos afectados: ${data.numero_equipos_afectados}.`);
  } else if (type === "mantenimiento") {
    parts.push(
      `Solicitud de mantenimiento${city ? ` en ${city}` : ""} para ${
        data.numero_equipos || "varios"
      } equipo(s) tipo ${data.tipo_equipo || "no especificado"}.`
    );
    if (data.marca) parts.push(`Marca/modelo: ${data.marca}.`);
    if (data.ultimo_mantenimiento) parts.push(`Último mantenimiento: ${data.ultimo_mantenimiento}.`);
    if (data.problemas_actuales === "Sí") parts.push("El cliente indica que nota algún problema actualmente.");
  }

  return parts.join(" ");
}
