import { PoolClient } from "pg";
import DatabaseConnection from "../db/connection";
import {
  Reservation,
  ReservationWithServices,
  WashService,
} from "../types";

class ReservationRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // Verifica que el vehículo exista en la BD
  async findVehicleById(vehicleId: string): Promise<boolean> {
    try {
      const rows = await this.db.query<{ id: string }>(
        `SELECT id FROM vehicles WHERE id = $1`,
        [vehicleId]
      );
      return rows.length > 0;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error verificando vehículo con id "${vehicleId}": ${err.message}`
      );
    }
  }

  // Verifica que todos los service_ids existan y estén activos, retorna los que sí existen
  async findServicesByIds(serviceIds: string[]): Promise<WashService[]> {
    try {
      const placeholders = serviceIds
        .map((_, i) => `$${i + 1}`)
        .join(", ");

      const rows = await this.db.query<WashService>(
        `SELECT id, name, price, description, duration, is_active, created_at
         FROM services
         WHERE id IN (${placeholders}) AND is_active = true`,
        serviceIds
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error buscando servicios por ids: ${err.message}`
      );
    }
  }

  // Verifica si el datetime solicitado ya está ocupado
  async isSlotTaken(datetime: Date): Promise<boolean> {
    try {
      const rows = await this.db.query<{ id: string }>(
        `SELECT id FROM reservations
         WHERE datetime = $1
           AND status NOT IN ('cancelada')`,
        [datetime]
      );
      return rows.length > 0;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error verificando disponibilidad del horario: ${err.message}`
      );
    }
  }

  // Crea la reserva y sus servicios asociados dentro de una transacción
  async createReservationWithServices(
    vehicleId: string,
    datetime: Date,
    services: WashService[]
  ): Promise<ReservationWithServices> {
    const client: PoolClient = await this.db.getClient();

    try {
      await client.query("BEGIN");

      const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
      const totalDuration = services.reduce((sum, s) => sum + Number(s.duration), 0);

      // Insertar reserva
      const reservationResult = await client.query<Reservation>(
        `INSERT INTO reservations (vehicle_id, datetime, status, total_price, total_duration, created_at, updated_at)
         VALUES ($1, $2, 'pendiente', $3, $4, NOW(), NOW())
         RETURNING *`,
        [vehicleId, datetime, totalPrice, totalDuration]
      );

      const reservation: Reservation = reservationResult.rows[0];

      // Insertar relaciones reserva-servicio
      for (const service of services) {
        await client.query(
          `INSERT INTO reservations_services (reservation_id, service_id)
           VALUES ($1, $2)`,
          [reservation.id, service.id]
        );
      }

      await client.query("COMMIT");

      return { ...reservation, services };
    } catch (error) {
      await client.query("ROLLBACK");
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error creando la reserva (transacción revertida): ${err.message}`
      );
    } finally {
      client.release();
    }
  }
}

export default ReservationRepository;