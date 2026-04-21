import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";

dotenv.config();

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on("error", (err: Error) => {
      console.error("[DB] Error inesperado en cliente inactivo del pool:", err.message);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    const client: PoolClient = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      const err = error as Error;
      throw new Error(`[DB] Error ejecutando query: ${err.message}`);
    } finally {
      client.release();
    }
  }

  public async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      const err = error as Error;
      throw new Error(`[DB] Error obteniendo cliente del pool: ${err.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      console.log("[DB] Pool de conexiones cerrado correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(`[DB] Error cerrando el pool: ${err.message}`);
    }
  }
}

export default DatabaseConnection;