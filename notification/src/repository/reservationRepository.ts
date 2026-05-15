import DatabaseConnection from "../db/connection";
import { ReservationDetail } from "../types";

class ReservationRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // ─── Buscar reservas de la hora actual (hora colombiana) ──────────────────

  /**
   * Encuentra todas las reservas programadas para la hora actual en hora colombiana.
   * Solo retorna reservas con estado "confirmada" que aún no han sido iniciadas.
   * Máximo 3 reservas por hora.
   */
  async findReservationsByCurrentHour(): Promise<string[]> {
    try {
      const rows = await this.db.query< { id: string } >(
        `SELECT
           r.id
         FROM reservations r
         WHERE r.status = 'pendiente'
           AND DATE_TRUNC('hour', r.datetime AT TIME ZONE 'America/Bogota') = 
               DATE_TRUNC('hour', NOW() AT TIME ZONE 'America/Bogota')
           AND NOT EXISTS (
             SELECT 1 FROM notifications
             WHERE notifications.reservation_id = r.id
               AND notifications.type = 'servicio_iniciado'
               AND notifications.status IN ('enviada', 'pendiente')
           )
         GROUP BY r.id`,
      );

      return rows.map((row) => row.id);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error obteniendo reservas de la hora actual: ${err.message}`
      );
    }
  }

  // ─── Actualizar estado de reserva ──────────────────────────────────────────

  /**
   * Actualiza el estado de una reserva específica.
   */
  async updateReservationStatus(
    reservationId: string,
    status: string
  ): Promise<void> {
    try {
      await this.db.query(
        `UPDATE reservations
         SET status = $1
         WHERE id = $2`,
        [status, reservationId]
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error actualizando estado de reserva "${reservationId}": ${err.message}`
      );
    }
  }
}

export default ReservationRepository;
