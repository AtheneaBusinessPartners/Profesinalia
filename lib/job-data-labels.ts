export const JOB_DATA_LABELS: Record<string, string> = {
  tipo_vivienda: "Tipo de vivienda",
  estancia: "Estancia",
  metros_cuadrados_estancia: "Metros cuadrados (estancia)",
  metros_cuadrados_vivienda: "Metros cuadrados (vivienda)",
  numero_estancias: "Número de estancias",
  orientacion: "Orientación",
  preinstalacion: "Preinstalación",
  equipo_actual: "Equipo actual",
  ubicacion_unidad_exterior: "Ubicación unidad exterior",
  marca_preferida: "Marca preferida",
  fecha_deseada: "Fecha deseada",
  problema: "Problema",
  desde_cuando: "Desde cuándo",
  sintomas: "Síntomas",
  marca: "Marca",
  modelo: "Modelo",
  codigo_error: "Código de error",
  numero_equipos_afectados: "Nº de equipos afectados",
  ultimo_mantenimiento: "Último mantenimiento",
};

export function labelForKey(key: string): string {
  if (JOB_DATA_LABELS[key]) return JOB_DATA_LABELS[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
