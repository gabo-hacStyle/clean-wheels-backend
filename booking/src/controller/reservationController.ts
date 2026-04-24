import { Router, Request, Response } from "express";
import ReservationService from "../service/reservationService";

import { requireGatewayAuth } from "../middlewares/auth.middleware";
import {
  ApiResponse,
  AvailabilityResult,
  CheckAvailabilityBody,
  CreateReservationBody,
  HourlySchedule,
  Reservation,
  ReservationWithServices,
  UpdateReservationBody,
} from "../types";

class ReservationController {
  public router: Router;
  private service: ReservationService;

  constructor() {
    this.router = Router();
    this.service = new ReservationService();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post("/availability", this.checkAvailability.bind(this));
    this.router.post("/", this.createReservation.bind(this));
    this.router.get("/upcoming", this.getUpcomingSchedule.bind(this));
    this.router.patch("/:id", requireGatewayAuth, this.updateReservation.bind(this));
  this.router.patch("/:id/cancel", requireGatewayAuth, this.cancelReservation.bind(this));
  }

  private async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CheckAvailabilityBody;

      if (!body.datetime || body.total_duration === undefined) {
        const response: ApiResponse<null> = {
          success: false,
          error: "Los campos datetime y total_duration son requeridos.",
        };
        res.status(400).json(response);
        return;
      }

      const result: AvailabilityResult =
        await this.service.checkAvailability(body);

      const response: ApiResponse<AvailabilityResult> = {
        success: true,
        data: result,
        message: result.message,
      };

      // 200 haya o no disponibilidad: es una consulta, no un error
      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;

      const isBusinessError =
        err.message.includes("mayor a 0") ||
        err.message.includes("fechas pasadas") ||
        err.message.includes("formato de fecha");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 422 : 500).json(response);
    }
  }

  private async createReservation(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateReservationBody;

      if (!body.vehicle_id || !body.datetime || !body.service_ids) {
        const response: ApiResponse<null> = {
          success: false,
          error:
            "Los campos vehicle_id, datetime y service_ids son requeridos.",
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

      const isBusinessError =
        err.message.includes("no existe") ||
        err.message.includes("no está disponible") ||
        err.message.includes("al menos un servicio") ||
        err.message.includes("no existen o no están disponibles") ||
        err.message.includes("formato de fecha") ||
        err.message.includes("fecha pasada");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 422 : 500).json(response);
    }
  }

  private async getUpcomingSchedule(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      const schedule: HourlySchedule[] =
        await this.service.getUpcomingSchedule();

      const response: ApiResponse<HourlySchedule[]> = {
        success: true,
        data: schedule,
        message: `Horario de las próximas 8 horas (${schedule.length} bloques).`,
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

  private async cancelReservation(
    req: Request<{ id: string }>,
    res: Response
  ): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.gatewayUser!;

    const cancelled = await this.service.cancelReservation(id, user);

    const response: ApiResponse<Reservation> = {
      success: true,
      data: cancelled,
      message: "Reserva cancelada exitosamente.",
    };

    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;

    const isBusinessError =
      err.message.includes("no existe") ||
      err.message.includes("no puede cancelarse") ||
      err.message.includes("No tienes permisos");

    const isForbidden = err.message.includes("No tienes permisos");

    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
    };

    res
      .status(isForbidden ? 403 : isBusinessError ? 422 : 500)
      .json(response);
  }
}

private async updateReservation(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body as UpdateReservationBody;
    const user = req.gatewayUser!;

    const updated = await this.service.updateReservation(id, body, user);

    const response: ApiResponse<ReservationWithServices> = {
      success: true,
      data: updated,
      message: "Reserva actualizada exitosamente.",
    };

    res.status(200).json(response);
  } catch (error) {
    const err = error as Error;

    const isForbidden = err.message.includes("No tienes permisos");

    const isBusinessError =
      err.message.includes("no existe") ||
      err.message.includes("no puede modificarse") ||
      err.message.includes("no está disponible") ||
      err.message.includes("no existen o no están disponibles") ||
      err.message.includes("formato de fecha") ||
      err.message.includes("fecha pasada") ||
      err.message.includes("al menos un campo") ||
      isForbidden;

    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
    };

    res
      .status(isForbidden ? 403 : isBusinessError ? 422 : 500)
      .json(response);
  }
}

  

  
}

export default ReservationController;