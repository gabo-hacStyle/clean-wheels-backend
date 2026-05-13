import { Router, Request, Response } from "express";
import VehicleService from "../service/vehicleService";

import { requireAdmin, requireGatewayAuth } from "../middlewares/auth.middleware";
import {
  ApiResponse,
  SaveVehicleRequest,
  UserRole,
  Vehicle,
  WeeklyCalendar,
  WeeklyCalendarQuery,
} from "../types";

class VehicleController {
    public router: Router
    private service: VehicleService;
    
    constructor(){
        this.router = Router();
        this.initRoutes();
        this.service = new VehicleService();
    }

    private initRoutes(): void {
        this.router.get("/:userId", requireGatewayAuth, this.getVehiclesByUser.bind(this));
        this.router.post("/:userId/add", requireGatewayAuth, this.saveVehicleForUser.bind(this))
    }

    private async getVehiclesByUser(
    req: Request<{ userId: string }>,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const gatewayUser = req.gatewayUser!;

      
      if (
        gatewayUser.role !== UserRole.ADMIN &&
        gatewayUser.id !== userId
      ) {
        const response: ApiResponse<null> = {
          success: false,
          error: "No tienes permisos para ver los vehículos de otro usuario.",
        };
        res.status(403).json(response);
        return;
      }

      const vehicles = await this.service.getVehiclesByUser(userId);

      const response: ApiResponse<Vehicle[]> = {
        success: true,
        data: vehicles,
        message:
          vehicles.length > 0
            ? `${vehicles.length} vehículo(s) encontrado(s).`
            : "El usuario no tiene vehículos registrados.",
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;
      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };
      res.status(500).json(response);
    }
  }

    private async saveVehicleForUser(
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> {
  try {
    const { userId } = req.params;
    const gatewayUser = req.gatewayUser!;
    const body = req.body as SaveVehicleRequest;

    if (
      gatewayUser.role !== UserRole.ADMIN &&
      gatewayUser.id !== userId
    ) {
      const response: ApiResponse<null> = {
        success: false,
        error: "No tienes permisos para registrar vehículos en esta cuenta.",
      };
      res.status(403).json(response);
      return;
    }

    if (!body.placa || !body.marca || !body.modelo) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Los campos placa, marca y modelo son requeridos.",
      };
      res.status(400).json(response);
      return;
    }

    const vehicle = await this.service.saveVehicleForUser(userId, body);

    const response: ApiResponse<Vehicle> = {
      success: true,
      data: vehicle,
      message: `Vehículo con placa "${vehicle.placa}" registrado exitosamente.`,
    };

    res.status(201).json(response);
  } catch (error) {
    const err = error as Error;

    const isBusinessError =
      err.message.includes("ya está registrado") ||
      err.message.includes("requerido");

    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
    };

    res.status(isBusinessError ? 422 : 500).json(response);
  }
}

}

export default VehicleController;