import { Router, Request, Response } from "express";
import NotificationService from "../service/notification"
import {
  ApiResponse,
  Feedback,
  Notification,
  NotificationType,
  SubmitFeedbackBody,
  TriggerNotificationBody,
} from "../types";

class NotificationController {
  public router: Router;
  private service: NotificationService;

  constructor() {
    this.router = Router();
    this.service = new NotificationService();
    this.initRoutes();
  }

  private initRoutes(): void {
    // Disparo manual de notificaciones (lo llamará el booking MS o el gateway)
    this.router.post("/trigger", this.triggerNotification.bind(this));

    // Recibir feedback del cliente tras finalizar el servicio
    this.router.post("/feedback", this.submitFeedback.bind(this));
  }

  // POST /notifications/trigger
  // Body: { reservation_id, type }
  private async triggerNotification(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const body = req.body as TriggerNotificationBody;

      if (!body.reservation_id || !body.type) {
        const response: ApiResponse<null> = {
          success: false,
          error: "Los campos reservation_id y type son requeridos.",
        };
        res.status(400).json(response);
        return;
      }

      const validTypes = Object.values(NotificationType) as string[];
      if (!validTypes.includes(body.type)) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Tipo de notificación inválido: "${body.type}". Valores permitidos: ${validTypes.join(", ")}`,
        };
        res.status(400).json(response);
        return;
      }

      let notification: Notification;

      switch (body.type) {
        case NotificationType.RESERVA_CREADA:
          notification = await this.service.sendReservaConfirmada(
            body.reservation_id
          );
          break;
        case NotificationType.RESERVA_CANCELADA:
          notification = await this.service.sendReservaCancelada(
            body.reservation_id
          );
          break;
        case NotificationType.SERVICIO_INICIADO:
          notification = await this.service.sendServicioIniciado(
            body.reservation_id
          );
          break;
        case NotificationType.SERVICIO_FINALIZADO:
          notification = await this.service.sendServicioFinalizado(
            body.reservation_id
          );
          break;
        default: {
          const response: ApiResponse<null> = {
            success: false,
            error: `El tipo "${body.type}" no puede dispararse manualmente.`,
          };
          res.status(422).json(response);
          return;
        }
      }

      const response: ApiResponse<Notification> = {
        success: true,
        data: notification,
        message: "Notificación enviada correctamente.",
      };

      res.status(200).json(response);
    } catch (error) {
      const err = error as Error;

      const isBusinessError =
        err.message.includes("no encontrada") ||
        err.message.includes("no existe");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 422 : 500).json(response);
    }
  }

  // POST /notifications/feedback
  // Body: { reservation_id, rating, feedback }
  private async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as SubmitFeedbackBody;

      if (!body.reservation_id || body.rating === undefined || !body.feedback) {
        const response: ApiResponse<null> = {
          success: false,
          error: "Los campos reservation_id, rating y feedback son requeridos.",
        };
        res.status(400).json(response);
        return;
      }

      const result: Feedback = await this.service.submitFeedback(body);

      const response: ApiResponse<Feedback> = {
        success: true,
        data: result,
        message: "Feedback registrado exitosamente. ¡Gracias por tu calificación!",
      };

      res.status(201).json(response);
    } catch (error) {
      const err = error as Error;

      const isBusinessError =
        err.message.includes("Ya existe") ||
        err.message.includes("no existe") ||
        err.message.includes("calificación") ||
        err.message.includes("vacío");

      const response: ApiResponse<null> = {
        success: false,
        error: err.message,
      };

      res.status(isBusinessError ? 422 : 500).json(response);
    }
  }
}

export default NotificationController;