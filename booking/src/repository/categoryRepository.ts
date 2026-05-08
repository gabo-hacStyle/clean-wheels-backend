import DatabaseConnection from "../db/connection";
import { Category, CategoryWithServices, WashService } from "../types";

class CategoryRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async findAll(): Promise<Category[]> {
    try {
      const rows = await this.db.query<Category>(
        `SELECT id, name, description, created_at, updated_at
         FROM categories
         ORDER BY name ASC`
      );
      return rows;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error obteniendo categorías: ${err.message}`
      );
    }
  }

  async findById(categoryId: string): Promise<Category | null> {
    try {
      const rows = await this.db.query<Category>(
        `SELECT id, name, description, created_at, updated_at
         FROM categories
         WHERE id = $1`,
        [categoryId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error buscando categoría "${categoryId}": ${err.message}`
      );
    }
  }

  async findByIdWithServices(
    categoryId: string
  ): Promise<CategoryWithServices | null> {
    try {
      const categoryRows = await this.db.query<Category>(
        `SELECT id, name, description, created_at, updated_at
         FROM categories
         WHERE id = $1`,
        [categoryId]
      );

      if (categoryRows.length === 0) return null;

      const category = categoryRows[0];

      const services = await this.db.query<WashService>(
        `SELECT id, name, price, description, url, duration, 
                category_id, created_at, updated_at
         FROM services
         WHERE category_id = $1
         ORDER BY name ASC`,
        [categoryId]
      );

      return { ...category, services };
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error obteniendo categoría con servicios "${categoryId}": ${err.message}`
      );
    }
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const rows = await this.db.query<{ id: string }>(
        `SELECT id FROM categories
         WHERE LOWER(name) = LOWER($1)
           AND ($2::text IS NULL OR id::text != $2)`,
        [name, excludeId ?? null]
      );
      return rows.length > 0;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error verificando nombre de categoría: ${err.message}`
      );
    }
  }

  async create(name: string, description: string): Promise<Category> {
    try {
      const rows = await this.db.query<Category>(
        `INSERT INTO categories (name, description, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [name, description]
      );
      return rows[0];
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error creando categoría: ${err.message}`
      );
    }
  }

  async update(
    categoryId: string,
    data: { name?: string; description?: string }
  ): Promise<Category> {
    try {
      const fields = Object.keys(data) as (keyof typeof data)[];
      if (fields.length === 0) {
        throw new Error("Debe enviar al menos un campo a actualizar.");
      }

      const setClauses = fields
        .map((key, i) => `${key} = $${i + 1}`)
        .join(", ");
      const values = fields.map((key) => data[key]);

      const rows = await this.db.query<Category>(
        `UPDATE categories
         SET ${setClauses}, updated_at = NOW()
         WHERE id = $${fields.length + 1}
         RETURNING *`,
        [...values, categoryId]
      );

      if (rows.length === 0) {
        throw new Error(`Categoría "${categoryId}" no encontrada.`);
      }

      return rows[0];
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error actualizando categoría "${categoryId}": ${err.message}`
      );
    }
  }



  async delete(categoryId: string): Promise<void> {
    try {
      // Verificar que no tenga servicios asociados antes de eliminar
      const services = await this.db.query<{ id: string }>(
        `SELECT id FROM services WHERE category_id = $1 LIMIT 1`,
        [categoryId]
      );

      if (services.length > 0) {
        throw new Error(
          `No se puede eliminar la categoría porque tiene servicios asociados. Desactívela o reasigne los servicios primero.`
        );
      }

      await this.db.query(
        `DELETE FROM categories WHERE id = $1`,
        [categoryId]
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryRepository] Error eliminando categoría "${categoryId}": ${err.message}`
      );
    }
  }
}

export default CategoryRepository;