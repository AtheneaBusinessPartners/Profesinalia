// Valida teléfonos españoles: 9 dígitos empezando por 6, 7, 8 o 9,
// con o sin prefijo +34 / 0034. Suficiente para evitar números
// inventados sin depender de un servicio externo de verificación por SMS.
export function isValidSpanishPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  return /^(?:\+34|0034)?[6-9]\d{8}$/.test(cleaned);
}
