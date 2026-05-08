import CategoryRepository from "../repository/categoryRepository";
import {
  Category,
  CategoryWithServices,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../types";

class CategoryService {
  private repository: CategoryRepository;

  constructor() {
    this.repository = new CategoryRepository();
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryService] Error al obtener categorías: ${err.message}`
      );
    }
  }

  async getCategoryWithServices(
    categoryId: string
  ): Promise<CategoryWithServices> {
    try {
      const category =
        await this.repository.findByIdWithServices(categoryId);

      if (!category) {
        throw new Error(`La categoría con id "${categoryId}" no existe.`);
      }

      return category;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryService] Error al obtener la categoría: ${err.message}`
      );
    }
  }

  async createCategory(body: CreateCategoryBody): Promise<Category> {
    try {
      const { name, description } = body;

      if (!name || name.trim().length === 0) {
        throw new Error("El campo name es requerido.");
      }

      if (!description || description.trim().length === 0) {
        throw new Error("El campo description es requerido.");
      }

      const nameExists = await this.repository.existsByName(name.trim());
      if (nameExists) {
        throw new Error(
          `Ya existe una categoría con el nombre "${name.trim()}".`
        );
      }

      return await this.repository.create(name.trim(), description.trim());
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryService] Error al crear la categoría: ${err.message}`
      );
    }
  }

  async updateCategory(
    categoryId: string,
    body: UpdateCategoryBody
  ): Promise<Category> {
    try {
      if (!body.name && !body.description) {
        throw new Error(
          "Debe enviar al menos un campo a modificar: name o description."
        );
      }

      const existing = await this.repository.findById(categoryId);
      if (!existing) {
        throw new Error(`La categoría con id "${categoryId}" no existe.`);
      }

      if (body.name) {
        const nameExists = await this.repository.existsByName(
          body.name.trim(),
          categoryId
        );
        if (nameExists) {
          throw new Error(
            `Ya existe otra categoría con el nombre "${body.name.trim()}".`
          );
        }
      }

      const data: UpdateCategoryBody = {};
      if (body.name) data.name = body.name.trim();
      if (body.description) data.description = body.description.trim();

      return await this.repository.update(categoryId, data);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryService] Error al actualizar la categoría: ${err.message}`
      );
    }
  }



  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const existing = await this.repository.findById(categoryId);
      if (!existing) {
        throw new Error(`La categoría con id "${categoryId}" no existe.`);
      }

      await this.repository.delete(categoryId);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[CategoryService] Error al eliminar la categoría: ${err.message}`
      );
    }
  }
}

export default CategoryService;