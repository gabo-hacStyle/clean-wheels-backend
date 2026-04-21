import { Router, Request, Response } from "express";
import WashServiceService from "../service/serviceService";
import { ApiResponse, WashService } from "../types";

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
}

export default ServiceController;