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
}

export default ServiceRepository;