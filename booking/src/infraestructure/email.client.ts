import { NotificationType } from "../types";

declare const process: { env: { NOTIFICATIONS_MS_URL?: string } };

interface TriggerPayload {
  reservation_id: string;
  type: NotificationType;
}

interface NotificationClientResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class NotificationClient {
  private static instance: NotificationClient;
  private readonly baseUrl: string;

  private constructor() {
    const url = process.env.NOTIFICATIONS_MS_URL;
    if (!url) {
      throw new Error(
        "[NotificationClient] La variable de entorno NOTIFICATIONS_MS_URL no está definida."
      );
    }
    this.baseUrl = url;
  }

  public static getInstance(): NotificationClient {
    if (!NotificationClient.instance) {
      NotificationClient.instance = new NotificationClient();
    }
    return NotificationClient.instance;
  }

  public async trigger(
    reservationId: string,
    type: NotificationType
  ): Promise<void> {
    const payload: TriggerPayload = {
      reservation_id: reservationId,
      type,
    };

    try {
      const response = await fetch(`${this.baseUrl}/notifications/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as NotificationClientResponse;

      if (!response.ok || !data.success) {
        // Loguear pero NO interrumpir el flujo principal del booking MS.
        // Una notificación fallida no debe revertir una reserva ya guardada.
        console.error(
          `[NotificationClient] Error disparando "${type}" para reserva "${reservationId}": ${data.error ?? response.statusText}`
        );
        return;
      }

      console.log(
        `[NotificationClient] Notificación "${type}" enviada correctamente para reserva "${reservationId}".`
      );
    } catch (error) {
      // Red caída, timeout, etc. — mismo criterio: logueamos, no lanzamos.
      const err = error as Error;
      console.error(
        `[NotificationClient] Fallo de red al disparar "${type}" para reserva "${reservationId}": ${err.message}`
      );
    }
  }
}

export default NotificationClient;