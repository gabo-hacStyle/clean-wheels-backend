import { Router, Request, Response } from "express";
import CategoryService from "../service/categoryService";
import { requireGatewayAuth, requireAdmin } from "../middlewares/auth.middleware";
import {
  ApiResponse,
  Category,
  CategoryWithServices,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../types";

class CategoryController {
  public router: Router;
  private service: CategoryService;

  constructor() {
    this.router = Router();
    this.service = new CategoryService();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get("/",              this.getAllCategories.bind(this));
    this.router.get("/:id",           this.getCategoryWithServices.bind(this));
    this.router.post("/",             requireGatewayAuth, requireAdmin, this.createCategory.bind(this));
    this.router.patch("/:id",         requireGatewayAuth, requireAdmin, this.updateCategory.bind(this));
    this.router.delete("/:id",        requireGatewayAuth, requireAdmin, this.deleteCategory.bind(this));
  }

  private async getAllCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.service.getAllCategories();

      const response: ApiResponse<Category[]> = {
        success: true,
        data: categories,
        message: `${categories.length} categoría(s) encontrada(s).`,
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }

  private async getCategoryWithServices(
     req: Request<{ id: string }>,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      const category = await this.service.getCategoryWithServices(id);

      const response: ApiResponse<CategoryWithServices> = {
        success: true,
        data: category,
        message: `Categoría "${category.name}" con ${category.services.length} servicio(s).`,
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;
      const isBusinessError = err.message.includes("no existe");
      res
        .status(isBusinessError ? 404 : 500)
        .json({ success: false, error: err.message });
    }
  }

  private async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateCategoryBody;

      if (!body.name || !body.description) {
        res.status(400).json({
          success: false,
          error: "Los campos name y description son requeridos.",
        });
        return;
      }

      const category = await this.service.createCategory(body);

      const response: ApiResponse<Category> = {
        success: true,
        data: category,
        message: "Categoría creada exitosamente.",
      };

      res.status(201).json(response);
    } catch (error) {
      const err = error as Error;
      const isBusinessError =
        err.message.includes("requerido") ||
        err.message.includes("Ya existe");
      res
        .status(isBusinessError ? 422 : 500)
        .json({ success: false, error: err.message });
    }
  }

  private async updateCategory(req: Request<{ id: string }> , res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateCategoryBody;

      if (!body.name && !body.description) {
        res.status(400).json({
          success: false,
          error: "Debe enviar al menos un campo: name o description.",
        });
        return;
      }

      const category = await this.service.updateCategory(id, body);

      const response: ApiResponse<Category> = {
        success: true,
        data: category,
        message: "Categoría actualizada exitosamente.",
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;
      const isBusinessError =
        err.message.includes("no existe") ||
        err.message.includes("Ya existe") ||
        err.message.includes("al menos un campo");
      res
        .status(isBusinessError ? 422 : 500)
        .json({ success: false, error: err.message });
    }
  }

  

  private async deleteCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.deleteCategory(id);

      const response: ApiResponse<null> = {
        success: true,
        message: "Categoría eliminada exitosamente.",
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;
      const isBusinessError =
        err.message.includes("no existe") ||
        err.message.includes("tiene servicios asociados");
      res
        .status(isBusinessError ? 422 : 500)
        .json({ success: false, error: err.message });
    }
  }
}

export default CategoryController;