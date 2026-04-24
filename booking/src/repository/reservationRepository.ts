import { PoolClient } from "pg";
import DatabaseConnection from "../db/connection";
import {
  Reservation,
  ReservationWithServices,
  WashService,
} from "../types";

class ReservationRepository {
  private db: DatabaseConnection;
  private static readonly MAX_CONCURRENT_RESERVATIONS = 3;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

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

  async findServicesByIds(serviceIds: string[]): Promise<WashService[]> {
    try {
      const placeholders = serviceIds.map((_, i) => `$${i + 1}`).join(", ");
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

  /**
   * Verifica si cada minuto dentro del slot solicitado tiene cupo disponible.
   *
   * Un slot de tiempo se considera ocupado cuando las 3 reservas activas
   * se solapan simultáneamente con él. Si en algún minuto del slot
   * solicitado ya hay 3 reservas activas al mismo tiempo, no hay disponibilidad.
   *
   * La lógica de solapamiento:
   *   Reserva existente ocupa [R.datetime, R.datetime + R.total_duration)
   *   Slot solicitado ocupa   [start, start + requestedDuration)
   *   Se solapan si: R.datetime < end AND (R.datetime + R.total_duration) > start
   */
  // Reemplazar la firma y query de countOverlappingReservations:
  async countOverlappingReservations(
    start: Date,
    end: Date,
    excludeReservationId?: string // para no contarse a sí misma al editar
  ): Promise<number> {
    try {
      const rows = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) AS count
        FROM reservations
        WHERE status NOT IN ('cancelada')
          AND ($3::int IS NULL OR id != $3::int)
          AND datetime < $2
          AND (datetime + (total_duration || ' minutes')::interval) > $1`,
        [start, end, excludeReservationId ?? null]
      );
      return parseInt(rows[0].count, 10);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationRepository] Error contando reservas solapadas: ${err.message}`
      );
    }
  }

  async createReservationWithServices(
    vehicleId: string,
    datetime: Date,
    services: WashService[]
  ): Promise<ReservationWithServices> {
    const client: PoolClient = await this.db.getClient();

    try {
      await client.query("BEGIN");

      const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
      const totalDuration = services.reduce(
        (sum, s) => sum + Number(s.duration),
        0
      );

      const reservationResult = await client.query(
        `INSERT INTO reservations
           (vehicle_id, datetime, status, total_price, total_duration, created_at, updated_at)
         VALUES ($1, $2, 'pendiente', $3, $4, NOW(), NOW())
         RETURNING *`,
        [vehicleId, datetime, totalPrice, totalDuration]
      );

      const reservation: Reservation = reservationResult.rows[0];

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

  async findReservationsNextHours(
  from: Date,
  to: Date
): Promise<ReservationWithServices[]> {
  try {
    // Trae todas las reservas activas que se solapan con la ventana [from, to]
    const rows = await this.db.query<Reservation & {
        placa: string;
        marca: string;
        modelo: string;
        service_names: string;
      }>(
      `SELECT
         r.id,
         r.vehicle_id,
         r.datetime,
         r.status,
         r.total_price,
         r.total_duration,
         r.created_at,
         r.updated_at,
         v.placa,
         v.marca,
         v.modelo,
         STRING_AGG(s.name, ', ' ORDER BY s.name) AS service_names
       FROM reservations r
       INNER JOIN vehicles v ON v.id = r.vehicle_id
       INNER JOIN reservations_services rs ON rs.reservation_id = r.id
       INNER JOIN services s ON s.id = rs.service_id
       WHERE r.status NOT IN ('cancelada')
         AND r.datetime < $2
         AND (r.datetime + (r.total_duration || ' minutes')::interval) > $1
       GROUP BY r.id, v.placa, v.marca, v.modelo
       ORDER BY r.datetime ASC`,
      [from, to]
    );

    return rows.map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      datetime: row.datetime,
      status: row.status,
      total_price: row.total_price,
      total_duration: row.total_duration,
      created_at: row.created_at,
      updated_at: row.updated_at,
      placa: row.placa,
      marca: row.marca,
      modelo: row.modelo,
      services: row.service_names
        ? row.service_names.split(", ").map((name) => ({ name } as any))
        : [],
    }));
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationRepository] Error obteniendo reservas de las próximas horas: ${err.message}`
    );
  }
  }


  // Busca una reserva por id con sus servicios
async findReservationById(
  reservationId: string
): Promise<ReservationWithServices | null> {
  try {
    const rows = await this.db.query<Reservation>(
      `SELECT * FROM reservations WHERE id = $1`,
      [reservationId]
    );

    if (rows.length === 0) return null;

    const reservation = rows[0];

    const services = await this.db.query<WashService>(
      `SELECT s.id, s.name, s.price, s.description, s.duration, s.is_active, s.created_at
       FROM services s
       INNER JOIN reservations_services rs ON rs.service_id = s.id
       WHERE rs.reservation_id = $1`,
      [reservationId]
    );

    return { ...reservation, services };
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationRepository] Error buscando reserva con id "${reservationId}": ${err.message}`
    );
  }
}

// Verifica si el usuario es propietario de alguno de los vehículos de la reserva
async isUserVehicleOwner(
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
      `[ReservationRepository] Error verificando propietario del vehículo: ${err.message}`
    );
  }
}

async cancelReservation(reservationId: string): Promise<Reservation> {
  try {
    const rows = await this.db.query<Reservation>(
      `UPDATE reservations
       SET status = 'cancelada', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reservationId]
    );

    if (rows.length === 0) {
      throw new Error(
        `No se encontró la reserva con id "${reservationId}" para cancelar.`
      );
    }

    return rows[0];
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationRepository] Error cancelando reserva: ${err.message}`
    );
  }
}

async updateReservation(
  reservationId: string,
  datetime: Date,
  services: WashService[]
): Promise<ReservationWithServices> {
  const client: PoolClient = await this.db.getClient();

  try {
    await client.query("BEGIN");

    const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
    const totalDuration = services.reduce(
      (sum, s) => sum + Number(s.duration),
      0
    );

    const reservationResult = await client.query(
      `UPDATE reservations
       SET datetime = $1,
           total_price = $2,
           total_duration = $3,
           status = 'pendiente',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [datetime, totalPrice, totalDuration, reservationId]
    );

    const updated: Reservation = reservationResult.rows[0];

    // Reemplazar servicios asociados
    await client.query(
      `DELETE FROM reservations_services WHERE reservation_id = $1`,
      [reservationId]
    );

    for (const service of services) {
      await client.query(
        `INSERT INTO reservations_services (reservation_id, service_id)
         VALUES ($1, $2)`,
        [reservationId, service.id]
      );
    }

    await client.query("COMMIT");

    return { ...updated, services };
  } catch (error) {
    await client.query("ROLLBACK");
    const err = error as Error;
    throw new Error(
      `[ReservationRepository] Error actualizando reserva (transacción revertida): ${err.message}`
    );
  } finally {
    client.release();
  }
}

  public getMaxConcurrentReservations(): number {
    return ReservationRepository.MAX_CONCURRENT_RESERVATIONS;
  }

  
}

export default ReservationRepository;