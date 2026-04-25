import { Router, Request, Response } from "express";
import WashServiceService from "../service/serviceService";
import { ApiResponse, CreateServiceBody, UpdateServiceBody, WashService } from "../types";
import { requireAdmin, requireGatewayAuth } from "../middlewares/auth.middleware";

class ServiceController {
  public router: Router;
  private service: WashServiceService;

  constructor() {
    this.router = Router();
    this.service = new WashServiceService();
    this.initRoutes();
  }

  private initRoutes(): void {
    // GET /services
    this.router.get("/", this.getAllServices.bind(this));
    this.router.post("/",
      requireGatewayAuth,
      requireAdmin,
      this.createService.bind(this)
    );
    this.router.patch(
      "/:id",
      requireGatewayAuth,
      requireAdmin,
      this.updateService.bind(this)
    );
    this.router.patch(
      "/:id/deactivate",
      requireGatewayAuth,
      requireAdmin,
      this.deactivateService.bind(this)
    );
    this.router.delete(
      "/:id",
      requireGatewayAuth,
      requireAdmin,
      this.deleteService.bind(this)
    );
  }

  private async getAllServices(_req: Request, res: Response): Promise<void> {
    try {
      const services: WashService[] = await this.service.getAllServices();

      const response: ApiResponse<WashService[]> = {
        success: true,
        data: services,
        message: `${services.length} servicio(s) encontrado(s).`,
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;

      const isBusinessError = err.message.includes("No hay servicios");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 404 : 500).json(response);
    }
  }

  // Métodos:
private async createService(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateServiceBody;
    const service = await this.service.createService(body);

    const response: ApiResponse<WashService> = {
      success: true,
      data: service,
      message: "Servicio creado exitosamente.",
    };
    res.status(201).json(response);
  } catch (error) {
    const err = error as Error;
    const isBusinessError =
      err.message.includes("requeridos") ||
      err.message.includes("negativo") ||
      err.message.includes("mayor a 0");

    res.status(isBusinessError ? 422 : 500).json({
      success: false,
      error: err.message,
    });
  }
}

private async updateService(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as UpdateServiceBody;
    const service = await this.service.updateService(id, body);

    const response: ApiResponse<WashService> = {
      success: true,
      data: service,
      message: "Servicio actualizado exitosamente.",
    };
    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;
    const isBusinessError =
      err.message.includes("no existe") ||
      err.message.includes("al menos un campo") ||
      err.message.includes("negativo") ||
      err.message.includes("mayor a 0");

    res.status(isBusinessError ? 422 : 500).json({
      success: false,
      error: err.message,
    });
  }
}

private async deactivateService(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const service = await this.service.deactivateService(id);

    const response: ApiResponse<WashService> = {
      success: true,
      data: service,
      message: "Servicio desactivado exitosamente.",
    };
    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;
    const isBusinessError =
      err.message.includes("no existe") ||
      err.message.includes("ya está desactivado");

    res.status(isBusinessError ? 422 : 500).json({
      success: false,
      error: err.message,
    });
  }
}

private async deleteService(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await this.service.deleteService(id);

    const response: ApiResponse<null> = {
      success: true,
      message: "Servicio eliminado exitosamente.",
    };
    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;
    const isBusinessError = err.message.includes("no existe");

    res.status(isBusinessError ? 422 : 500).json({
      success: false,
      error: err.message,
    });
  }
}
}

export default ServiceController;