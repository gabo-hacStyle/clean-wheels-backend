// src/utils/date.utils.ts  (archivo nuevo)

const COLOMBIA_TZ = "America/Bogota";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Recibe una fecha ("2025-06-15") y una hora ("13:00") en hora de Colombia
 * y devuelve el objeto Date equivalente en UTC que se guardará en PostgreSQL.
 *
 * Colombia = UTC-5 (sin horario de verano, offset fijo).
 * "2025-06-15T13:00:00" en Bogotá → "2025-06-15T18:00:00Z" en UTC.
 */
export function parseColombiaDT(date: string, time: string): Date {
  if (!DATE_REGEX.test(date)) {
    throw new Error(
      `Formato de fecha inválido: "${date}". Use YYYY-MM-DD (ej: "2025-06-15").`
    );
  }

  if (!TIME_REGEX.test(time)) {
    throw new Error(
      `Formato de hora inválido: "${time}". Use HH:mm en hora de Colombia (ej: "13:00").`
    );
  }

  // Construir la fecha como si fuera UTC y luego compensar el offset de Colombia (-05:00)
  const isoWithOffset = `${date}T${time}:00-05:00`;
  const parsed = new Date(isoWithOffset);

  if (isNaN(parsed.getTime())) {
    throw new Error(
      `La combinación de fecha y hora no es válida: "${date} ${time}".`
    );
  }

  return parsed;
}

/**
 * Valida que el Date resultante no sea en el pasado.
 * Se agrega 1 minuto de tolerancia para evitar falsos negativos por latencia de red.
 */
export function assertNotPast(dt: Date, label = "La fecha y hora"): void {
  const now = new Date();
  const tolerance = 60 * 1000; // 1 minuto en ms
  if (dt.getTime() < now.getTime() - tolerance) {
    throw new Error(
      `${label} no puede ser en el pasado. Recibido: "${formatColombia(dt)}".`
    );
  }
}

/**
 * Formatea un Date a hora legible en Colombia, útil para mensajes de error.
 */
export function formatColombia(dt: Date): string {
  return dt.toLocaleString("es-CO", {
    timeZone: COLOMBIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}