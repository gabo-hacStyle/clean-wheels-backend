import { PoolClient } from "pg";
import DatabaseConnection from "../db/connection";
import { Vehicle } from "../types";

class VehicleRepository {
    private db: DatabaseConnection;
    
    constructor(){
        this.db = DatabaseConnection.getInstance();
    }
    async findVehiclesByUserId(userId: string): Promise<Vehicle[]> {
        try {
          const rows = await this.db.query<Vehicle>(
            `SELECT v.id, v.placa, v.marca, v.modelo, v.created_at
            FROM vehicles v
            INNER JOIN vehicles_users vu ON vu.vehicle_id = v.id
            WHERE vu.user_id = $1`,
            [userId]
          );
          return rows;
        } catch (error) {
          const err = error as Error;
          throw new Error(
            `[ReservationRepository] Error obteniendo vehículos del usuario "${userId}": ${err.message}`
          );
        }
    }

    async findVehicleByPlaca(placa: string): Promise<Vehicle | null> {
      try {
        const rows = await this.db.query<Vehicle>(
          `SELECT id, placa, marca, modelo, created_at, updated_at
          FROM vehicles
          WHERE UPPER(placa) = UPPER($1)`,
          [placa]
        );
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        const err = error as Error;
        throw new Error(
          `[VehicleRepository] Error buscando vehículo por placa "${placa}": ${err.message}`
        );
      }
  }

async isVehicleAlreadyLinkedToUser(
  vehicleId: string,
  userId: string
): Promise<boolean> {
  try {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM vehicles_users
       WHERE vehicle_id = $1 AND user_id = $2`,
      [vehicleId, userId]
    );
    return rows.length > 0;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[VehicleRepository] Error verificando vínculo vehículo-usuario: ${err.message}`
    );
  }
}

async createVehicle(
  placa: string,
  marca: string,
  modelo: string
): Promise<Vehicle> {
  try {
    const rows = await this.db.query<Vehicle>(
      `INSERT INTO vehicles (placa, marca, modelo, created_at, updated_at)
       VALUES (UPPER($1), $2, $3, NOW(), NOW())
       RETURNING *`,
      [placa, marca, modelo]
    );
    return rows[0];
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[VehicleRepository] Error creando vehículo con placa "${placa}": ${err.message}`
    );
  }
}

async linkVehicleToUser(
  vehicleId: string,
  userId: string
): Promise<void> {
  try {
    await this.db.query(
      `INSERT INTO vehicles_users (vehicle_id, user_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [vehicleId, userId]
    );
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[VehicleRepository] Error vinculando vehículo "${vehicleId}" al usuario "${userId}": ${err.message}`
    );
  }
}

  async findAllVehicles(): Promise<Vehicle[]> {
    try {
      const rows = await this.db.query<Vehicle>(
        `SELECT id, placa, marca, modelo, created_at, updated_at
         FROM vehicles`
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[VehicleRepository] Error obteniendo todos los vehículos: ${err.message}`
      );
    }
  }
}

export default VehicleRepository;