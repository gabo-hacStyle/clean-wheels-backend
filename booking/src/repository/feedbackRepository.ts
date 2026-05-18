import DatabaseConnection from "../db/connection";
import { Feedback, SaveFeedbackBody } from "../types";

class FeedbackRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // Verifica que la reserva exista y retorna su vehicle_id
  async findReservationVehicleId(
    reservationId: string
  ): Promise<string | null> {
    try {
      const rows = await this.db.query<{ vehicle_id: string }>(
        `SELECT vehicle_id FROM reservations WHERE id = $1`,
        [reservationId]
      );
      return rows.length > 0 ? rows[0].vehicle_id : null;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackRepository] Error buscando reserva "${reservationId}": ${err.message}`
      );
    }
  }

  // Verifica que el usuario esté vinculado al vehículo
  async isUserLinkedToVehicle(
    userId: string,
    vehicleId: string
  ): Promise<boolean> {
    try {
      const rows = await this.db.query<{ id: string }>(
        `SELECT id FROM vehicles_users
         WHERE user_id = $1 AND vehicle_id = $2`,
        [userId, vehicleId]
      );
      return rows.length > 0;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackRepository] Error verificando vínculo usuario-vehículo: ${err.message}`
      );
    }
  }

  // Verifica si ya existe feedback para esa reserva (relación 1 a 1)
  async findByReservationId(reservationId: string): Promise<Feedback | null> {
    try {
      const rows = await this.db.query<Feedback>(
        `SELECT * FROM feedback WHERE reservation_id = $1`,
        [reservationId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackRepository] Error buscando feedback de reserva "${reservationId}": ${err.message}`
      );
    }
  }

  async findReservationStatus(reservationId: string): Promise<string | null> {
    try {
      const rows = await this.db.query<{ status: string }>(
        `SELECT status FROM reservations WHERE id = $1`,
        [reservationId]
      );
      return rows.length > 0 ? rows[0].status : null;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackRepository] Error buscando estado de reserva "${reservationId}": ${err.message}`
      );
    }
  }

  async create(
    reservationId: string,
    rating: number,
    feedbackText: string
  ): Promise<Feedback> {
    try {
      const rows = await this.db.query<Feedback>(
        `INSERT INTO feedback (reservation_id, rating, feedback, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [reservationId, rating, feedbackText]
      );
      return rows[0];
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackRepository] Error guardando feedback: ${err.message}`
      );
    }
  }
}

export default FeedbackRepository;