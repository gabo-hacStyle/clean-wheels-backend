import DatabaseConnection from "../db/connection";
import { WashService } from "../types";

class ServiceRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async findAllActive(): Promise<WashService[]> {
    try {
      const rows = await this.db.query<WashService>(
        `SELECT id, name, price, description, duration, is_active, created_at
         FROM services
         WHERE is_active = true
         ORDER BY name ASC`
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ServiceRepository] Error obteniendo la lista de servicios: ${err.message}`
      );
    }
  }

  async findById(serviceId: string): Promise<WashService | null> {
  try {
    const rows = await this.db.query<WashService>(
      `SELECT id, name, price, description, duration, is_active, created_at
       FROM services WHERE id = $1`,
      [serviceId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error buscando servicio "${serviceId}": ${err.message}`
    );
  }
}

async create(
  data: Pick<WashService, "name" | "price" | "description" | "duration">
): Promise<WashService> {
  try {
    const rows = await this.db.query<WashService>(
      `INSERT INTO services (name, price, description, duration, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING *`,
      [data.name, data.price, data.description, data.duration]
    );
    return rows[0];
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error creando servicio: ${err.message}`
    );
  }
}

async update(
  serviceId: string,
  data: Partial<Pick<WashService, "name" | "price" | "description" | "duration">>
): Promise<WashService> {
  try {
    // Construir SET dinámico solo con los campos enviados
    const fields = Object.keys(data) as (keyof typeof data)[];
    if (fields.length === 0) {
      throw new Error("Debe enviar al menos un campo a actualizar.");
    }

    const setClauses = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = fields.map((key) => data[key]);

    const rows = await this.db.query<WashService>(
      `UPDATE services SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, serviceId]
    );

    if (rows.length === 0) {
      throw new Error(`Servicio "${serviceId}" no encontrado.`);
    }

    return rows[0];
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error actualizando servicio "${serviceId}": ${err.message}`
    );
  }
}

async deactivate(serviceId: string): Promise<WashService> {
  try {
    const rows = await this.db.query<WashService>(
      `UPDATE services SET is_active = false WHERE id = $1 RETURNING *`,
      [serviceId]
    );
    if (rows.length === 0) {
      throw new Error(`Servicio "${serviceId}" no encontrado.`);
    }
    return rows[0];
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error desactivando servicio "${serviceId}": ${err.message}`
    );
  }
}

async delete(serviceId: string): Promise<void> {
  try {
    const result = await this.db.query(
      `DELETE FROM services WHERE id = $1`,
      [serviceId]
    );
    if ((result as any).length === 0) {
      throw new Error(`Servicio "${serviceId}" no encontrado.`);
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error eliminando servicio "${serviceId}": ${err.message}`
    );
  }
}
}

export default ServiceRepository;