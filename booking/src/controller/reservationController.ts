import { Router, Request, Response } from "express";
import ReservationService from "../service/reservationService";
import { ApiResponse, CreateReservationBody, ReservationWithServices } from "../types";

class ReservationController {
  public router: Router;
  private service: ReservationService;

  constructor() {
    this.router = Router();
    this.service = new ReservationService();
    this.initRoutes();
  }

  private initRoutes(): void {
    // POST /reservations
    this.router.post("/", this.createReservation.bind(this));
  }

  private async createReservation(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateReservationBody;

      // Validaciones básicas del body
      if (!body.vehicle_id || !body.datetime || !body.service_ids) {
        const response: ApiResponse<null> = {
          success: false,
          error: "Los campos vehicle_id, datetime y service_ids son requeridos.",
        };
        res.status(400).json(response);
        return;
      }

      const reservation: ReservationWithServices =
        await this.service.createReservation(body);

      const response: ApiResponse<ReservationWithServices> = {
        success: true,
        data: reservation,
        message: "Reserva creada exitosamente.",
      };

      res.status(201).json(response);
    } catch (error) {
      const err = error as Error;

      // Errores de negocio (disponibilidad, vehículo no existe, etc.)
      const isBusinessError =
        err.message.includes("no existe") ||
        err.message.includes("no está disponible") ||
        err.message.includes("al menos un servicio") ||
        err.message.includes("no existen o no están disponibles") ||
        err.message.includes("formato de fecha");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 422 : 500).json(response);
    }
  }
}

export default ReservationController;