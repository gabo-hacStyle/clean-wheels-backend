import DatabaseConnection from "../db/connection";
import { WashService, WashServiceResponse, WashServiceResponseAdmin } from "../types";

class ServiceRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async findAll(): Promise<WashServiceResponseAdmin[]> {
    try {
      const rows = await this.db.query<WashServiceResponseAdmin>(
        `SELECT s.id, s.name, s.price, s.description, s.duration, s.is_active, 
          c.name as category_name, s.url as image_url, s.created_at
          FROM services s
          LEFT JOIN categories c ON s.category_id = c.id
          ORDER BY s.name ASC`
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ServiceRepository] Error obteniendo la lista completa de servicios: ${err.message}`
      );
    }
  }

  async findAllActive(): Promise<WashServiceResponse[]> {
    try {
      const rows = await this.db.query<WashServiceResponse>(
        `SELECT s.id, s.name, s.price, s.description, s.duration, c.name as category_name, s.url as image_url
         FROM services s
         LEFT JOIN categories c ON s.category_id = c.id
         WHERE s.is_active = true
         ORDER BY s.name ASC`
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
  data: Pick<WashService, "name" | "price" | "description" | "url" | "duration" | "category_id">
): Promise<WashService> {
  try {
    const rows = await this.db.query<WashService>(
      `INSERT INTO services
         (name, price, description, url, duration, is_active, category_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())
       RETURNING *`,
      [data.name, data.price, data.description, data.url ?? null, data.duration, data.category_id]
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
  data: Partial<Pick<WashService, "name" | "price" | "description" | "url" | "duration" | "category_id">>
): Promise<WashService> {
  try {
    const fields = Object.keys(data) as (keyof typeof data)[];
    if (fields.length === 0) {
      throw new Error("Debe enviar al menos un campo a actualizar.");
    }

    const setClauses = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = fields.map((key) => data[key]);

    const rows = await this.db.query<WashService>(
      `UPDATE services
       SET ${setClauses}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING *`,
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


async categoryExists(categoryId: string): Promise<boolean> {
  try {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM categories WHERE id = $1`,
      [categoryId]
    );
    return rows.length > 0;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ServiceRepository] Error verificando categoría "${categoryId}": ${err.message}`
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
    if (result.length === 0) {
      console.log(`Servicio "${serviceId}" no encontrado para eliminar.`);
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