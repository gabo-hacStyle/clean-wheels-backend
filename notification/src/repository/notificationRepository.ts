import DatabaseConnection from "../db/connection";
import {
  DailyReportRow,
  Feedback,
  Notification,
  NotificationStatus,
  NotificationType,
  ReservationDetail,
} from "../types";

class NotificationRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // ─── Reservas ─────────────────────────────────────────────────────────────

  async findReservationDetail(
    reservationId: string
  ): Promise<ReservationDetail | null> {
    try {
      const rows = await this.db.query<ReservationDetail & { service_names: string }>(
        `SELECT
           r.id,
           r.vehicle_id,
           r.datetime,
           r.status,
           r.total_duration,
           r.total_price,
           v.placa,
           v.marca,
           v.modelo,
           u.email       AS user_email,
           u.id          AS user_id,
           STRING_AGG(s.name, ', ' ORDER BY s.name) AS service_names
         FROM reservations r
         INNER JOIN vehicles v          ON v.id = r.vehicle_id
         INNER JOIN vehicles_users vu   ON vu.vehicle_id = v.id
         INNER JOIN users u             ON u.id = vu.user_id
         INNER JOIN reservations_services rs ON rs.reservation_id = r.id
         INNER JOIN services s          ON s.id = rs.service_id
         WHERE r.id = $1
         GROUP BY r.id, v.placa, v.marca, v.modelo, u.email, u.id`,
        [reservationId]
      );

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        services: row.service_names ? row.service_names.split(", ") : [],
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error obteniendo detalle de reserva "${reservationId}": ${err.message}`
      );
    }
  }

  // Reservas del día siguiente para el recordatorio de 24h
  async findReservationsScheduledTomorrow(): Promise<ReservationDetail[]> {
    try {
      const rows = await this.db.query<ReservationDetail & { service_names: string }>(
        `SELECT
           r.id,
           r.vehicle_id,
           r.datetime,
           r.status,
           r.total_duration,
           r.total_price,
           v.placa,
           v.marca,
           v.modelo,
           u.email       AS user_email,
           u.id          AS user_id,
           STRING_AGG(s.name, ', ' ORDER BY s.name) AS service_names
         FROM reservations r
         INNER JOIN vehicles v          ON v.id = r.vehicle_id
         INNER JOIN vehicles_users vu   ON vu.vehicle_id = v.id
         INNER JOIN users u             ON u.id = vu.user_id
         INNER JOIN reservations_services rs ON rs.reservation_id = r.id
         INNER JOIN services s          ON s.id = rs.service_id
         WHERE r.status NOT IN ('cancelada', 'finalizada')
           AND r.datetime >= NOW() + INTERVAL '23 hours'
           AND r.datetime <  NOW() + INTERVAL '25 hours'
         GROUP BY r.id, v.placa, v.marca, v.modelo, u.email, u.id
         ORDER BY r.datetime ASC`
      );

      return rows.map((row) => ({
        ...row,
        services: row.service_names ? row.service_names.split(", ") : [],
      }));
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error obteniendo reservas de mañana: ${err.message}`
      );
    }
  }

  // Reservas del día actual para el reporte diario del admin
  async findTodayReservations(): Promise<DailyReportRow[]> {
    try {
      const rows = await this.db.query<DailyReportRow & { service_names: string }>(
        `SELECT
           r.id              AS reservation_id,
           r.datetime,
           r.status,
           v.placa,
           v.marca,
           v.modelo,
           STRING_AGG(s.name, ', ' ORDER BY s.name) AS service_names
         FROM reservations r
         INNER JOIN vehicles v              ON v.id = r.vehicle_id
         INNER JOIN reservations_services rs ON rs.reservation_id = r.id
         INNER JOIN services s              ON s.id = rs.service_id
         WHERE r.datetime::date = CURRENT_DATE
           AND r.status NOT IN ('cancelada')
         GROUP BY r.id, v.placa, v.marca, v.modelo
         ORDER BY r.datetime ASC`
      );

      return rows.map((row) => ({
        ...row,
        services: row.service_names,
      }));
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error obteniendo reservas de hoy: ${err.message}`
      );
    }
  }

  // ─── Notificaciones ───────────────────────────────────────────────────────

  async createNotification(
    data: Omit<Notification, "id" | "sent_at" | "created_at">
  ): Promise<Notification> {
    try {
      const rows = await this.db.query<Notification>(
        `INSERT INTO notifications
           (user_id, vehicle_id, reservation_id, type, channel, status, scheduled_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          data.user_id,
          data.vehicle_id,
          data.reservation_id,
          data.type,
          data.channel,
          data.status,
          data.scheduled_at,
        ]
      );
      return rows[0];
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error creando notificación: ${err.message}`
      );
    }
  }

  async markAsSent(notificationId: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE notifications
         SET status = $1, sent_at = NOW()
         WHERE id = $2`,
        [NotificationStatus.ENVIADA, notificationId]
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error marcando notificación "${notificationId}" como enviada: ${err.message}`
      );
    }
  }

  async markAsFailed(notificationId: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE notifications
         SET status = $1
         WHERE id = $2`,
        [NotificationStatus.FALLIDA, notificationId]
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error marcando notificación "${notificationId}" como fallida: ${err.message}`
      );
    }
  }

  // Notificaciones fallidas pendientes de reintento
  async findFailedNotifications(): Promise<Notification[]> {
    try {
      const rows = await this.db.query<Notification>(
        `SELECT * FROM notifications
         WHERE status = $1
         ORDER BY created_at ASC
         LIMIT 50`,
        [NotificationStatus.FALLIDA]
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error obteniendo notificaciones fallidas: ${err.message}`
      );
    }
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async findFeedbackByReservation(
    reservationId: string
  ): Promise<Feedback | null> {
    try {
      const rows = await this.db.query<Feedback>(
        `SELECT * FROM feedback WHERE reservation_id = $1`,
        [reservationId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error buscando feedback de reserva "${reservationId}": ${err.message}`
      );
    }
  }

  async createFeedback(
    reservationId: string,
    rating: number,
    feedbackText: string
  ): Promise<Feedback> {
    try {
      const rows = await this.db.query<Feedback>(
        `INSERT INTO feedback (reservation_id, rating, feedback, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [reservationId, rating, feedbackText]
      );
      return rows[0];
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error guardando feedback: ${err.message}`
      );
    }
  }

  async findAdminEmails(): Promise<string[]> {
    try {
      const rows = await this.db.query<{ email: string }>(
        `SELECT email FROM users WHERE rol = 'ADMIN'`
      );
      return rows.map((r) => r.email);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationRepository] Error obteniendo emails de admins: ${err.message}`
      );
    }
  }
}

export default NotificationRepository;