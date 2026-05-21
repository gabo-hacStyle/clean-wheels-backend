import { Router, Request, Response } from "express";
import FeedbackService from "../service/feedbackService";
import { requireGatewayAuth } from "../middlewares/auth.middleware";
import { ApiResponse, Feedback, SaveFeedbackBody } from "../types";

class FeedbackController {
  public router: Router;
  private service: FeedbackService;

  constructor() {
    this.router = Router();
    this.service = new FeedbackService();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      "/:reservationId",
      requireGatewayAuth,
      this.saveFeedback.bind(this)
    );
  }

  private async saveFeedback(
    req: Request<{ reservationId: string }>,
    res: Response
  ): Promise<void> {
    try {
      const { reservationId } = req.params;
      const body = req.body as SaveFeedbackBody;
      const user = req.gatewayUser!;

      // Validación básica del body antes de llegar al servicio
      if (body.rating === undefined || body.rating === null) {
        const response: ApiResponse<null> = {
          success: false,
          error: "El campo rating es requerido.",
        };
        res.status(400).json(response);
        return;
      }

      const feedback = await this.service.saveFeedback(
        reservationId,
        body,
        user
      );

      const response: ApiResponse<Feedback> = {
        success: true,
        data: feedback,
        message: "Feedback guardado exitosamente.",
      };

      res.status(201).json(response);
    } catch (error) {
      const err = error as Error;

      const isForbidden = err.message.includes("No tienes permisos");

      const isBusinessError =
        isForbidden ||
        err.message.includes("no existe") ||
        err.message.includes("Ya existe") ||
        err.message.includes("calificación") ||
        err.message.includes("caracteres") ||
        err.message.includes("vacío") ||
        err.message.includes("finalizadas");

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

export default FeedbackController;