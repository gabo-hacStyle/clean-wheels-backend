import FeedbackRepository from "../repository/feedbackRepository";
import { Feedback, GatewayUser, SaveFeedbackBody } from "../types";

const MAX_FEEDBACK_LENGTH = 200;

class FeedbackService {
  private repository: FeedbackRepository;

  constructor() {
    this.repository = new FeedbackRepository();
  }

  async saveFeedback(
    reservationId: string,
    body: SaveFeedbackBody,
    user: GatewayUser
  ): Promise<Feedback> {
    try {
      const { rating, feedback } = body;

      // Validar rating
      if (rating === undefined || rating === null) {
        throw new Error("El campo rating es requerido.");
      }

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error(
          "La calificación debe ser un número entero entre 1 y 5."
        );
      }


      if (feedback.trim().length > MAX_FEEDBACK_LENGTH) {
        throw new Error(
          `El comentario no puede superar los ${MAX_FEEDBACK_LENGTH} caracteres. Recibidos: ${feedback.trim().length}.`
        );
      }

      // Verificar que la reserva existe
      const vehicleId =
        await this.repository.findReservationVehicleId(reservationId);

      if (!vehicleId) {
        throw new Error(
          `La reserva con id "${reservationId}" no existe.`
        );
      }

      // Verificar que la reserva esté finalizada
      const status =
        await this.repository.findReservationStatus(reservationId);

      if (status !== "finalizada") {
        throw new Error(
          `Solo se puede dejar feedback en reservas finalizadas. Estado actual: "${status}".`
        );
      }

      // Verificar que el usuario tiene relación con el vehículo de la reserva
      const isLinked = await this.repository.isUserLinkedToVehicle(
        user.id,
        vehicleId
      );

      if (!isLinked) {
        throw new Error(
          "No tienes permisos para dejar feedback en esta reserva."
        );
      }

      // Verificar relación 1 a 1: que no exista feedback previo
      const existing =
        await this.repository.findByReservationId(reservationId);

      if (existing) {
        throw new Error(
          `Ya existe un feedback registrado para la reserva "${reservationId}".`
        );
      }

      return await this.repository.create(
        reservationId,
        rating,
        feedback.trim()
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[FeedbackService] Error al guardar feedback: ${err.message}`
      );
    }
  }
}

export default FeedbackService;