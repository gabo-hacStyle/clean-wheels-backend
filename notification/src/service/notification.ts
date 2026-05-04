import NotificationRepository from "../repository/notificationRepository";
import Mailer from "../infraestructure/mailer";
import {
  DailyReportRow,
  Feedback,
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  ReservationDetail,
  SubmitFeedbackBody,
} from "../types";

class NotificationService {
  private repository: NotificationRepository;
  private mailer: Mailer;

  constructor() {
    this.repository = new NotificationRepository();
    this.mailer = Mailer.getInstance();
  }

  // ─── Templates de email ───────────────────────────────────────────────────

  private buildReservaConfirmadaHtml(detail: ReservationDetail): string {
    const fecha = new Date(detail.datetime).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
    });
    return `
      <h2>¡Tu reserva ha sido confirmada!</h2>
      <p><strong>Vehículo:</strong> ${detail.marca} ${detail.modelo} — ${detail.placa}</p>
      <p><strong>Fecha y hora:</strong> ${fecha}</p>
      <p><strong>Servicios:</strong> ${detail.services.join(", ")}</p>
      <p><strong>Precio total:</strong> $${detail.total_price}</p>
      <p>Te esperamos. Si necesitas cancelar o reprogramar, hazlo con al menos 2 horas de anticipación.</p>
    `;
  }

  private buildRecordatorio24hHtml(detail: ReservationDetail): string {
    const fecha = new Date(detail.datetime).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
    });
    return `
      <h2>Recordatorio: tienes una reserva mañana</h2>
      <p><strong>Vehículo:</strong> ${detail.marca} ${detail.modelo} — ${detail.placa}</p>
      <p><strong>Fecha y hora:</strong> ${fecha}</p>
      <p><strong>Servicios:</strong> ${detail.services.join(", ")}</p>
      <p>¡Te esperamos!</p>
    `;
  }

  private buildServicioIniciadoHtml(detail: ReservationDetail): string {
    return `
      <h2>El lavado de tu vehículo ha iniciado</h2>
      <p><strong>Vehículo:</strong> ${detail.marca} ${detail.modelo} — ${detail.placa}</p>
      <p><strong>Servicios en proceso:</strong> ${detail.services.join(", ")}</p>
      <p>Duración estimada: ${detail.total_duration} minutos.</p>
    `;
  }

  private buildServicioFinalizadoHtml(
    detail: ReservationDetail,
    feedbackUrl: string
  ): string {
    return `
      <h2>¡Tu servicio ha finalizado!</h2>
      <p><strong>Vehículo:</strong> ${detail.marca} ${detail.modelo} — ${detail.placa}</p>
      <p><strong>Servicios realizados:</strong> ${detail.services.join(", ")}</p>
      <p>¿Cómo fue tu experiencia? <a href="${feedbackUrl}">Califica el servicio aquí</a></p>
    `;
  }

  private buildReservaCanceladaHtml(detail: ReservationDetail): string {
    const fecha = new Date(detail.datetime).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
    });
    return `
      <h2>Tu reserva ha sido cancelada</h2>
      <p><strong>Vehículo:</strong> ${detail.marca} ${detail.modelo} — ${detail.placa}</p>
      <p><strong>Fecha que tenías agendada:</strong> ${fecha}</p>
      <p>Si deseas reagendar, puedes hacerlo desde nuestra plataforma.</p>
    `;
  }

  private buildReporteDiarioHtml(
    rows: DailyReportRow[],
    date: string
  ): string {
    if (rows.length === 0) {
      return `<h2>Reporte diario — ${date}</h2><p>No hay reservas para el día de hoy.</p>`;
    }

    const filas = rows
      .map((r) => {
        const hora = new Date(r.datetime).toLocaleTimeString("es-CO", {
          timeZone: "America/Bogota",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
          <tr>
            <td>${hora}</td>
            <td>${r.placa}</td>
            <td>${r.marca} ${r.modelo}</td>
            <td>${r.services}</td>
            <td>${r.status}</td>
          </tr>`;
      })
      .join("");

    return `
      <h2>Reporte diario — ${date}</h2>
      <p>Total de reservas: <strong>${rows.length}</strong></p>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead>
          <tr>
            <th>Hora</th><th>Placa</th><th>Vehículo</th>
            <th>Servicios</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    `;
  }

  // ─── Lógica de envío con registro ────────────────────────────────────────

  private async sendAndRecord(
    detail: ReservationDetail,
    type: NotificationType,
    subject: string,
    html: string
  ): Promise<Notification> {
    // Registrar notificación en BD antes de intentar el envío
    console.log("llEgando a sendAndRecord con ");
    const notification = await this.repository.createNotification({
      user_id: detail.user_id,
      vehicle_id: detail.vehicle_id,
      reservation_id: detail.id,
      type,
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.PENDIENTE,
      scheduled_at: new Date(),
    });

    try {
      await this.mailer.send({ to: detail.user_email, subject, html });
      await this.repository.markAsSent(notification.id);
      return { ...notification, status: NotificationStatus.ENVIADA };
    } catch (error) {
      await this.repository.markAsFailed(notification.id);
      const err = error as Error;
      throw new Error(
        `[NotificationService] Envío fallido (notificación registrada como FALLIDA): ${err.message}`
      );
    }
  }

  // ─── Métodos por tipo de evento ───────────────────────────────────────────

  async sendReservaConfirmada(reservationId: string): Promise<Notification> {
    try {
      const detail = await this.repository.findReservationDetail(reservationId);
      if (!detail) {
        throw new Error(`Reserva "${reservationId}" no encontrada.`);
      }

      return await this.sendAndRecord(
        detail,
        NotificationType.RESERVA_CREADA,
        "¡Tu reserva ha sido confirmada!",
        this.buildReservaConfirmadaHtml(detail)
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error en notificación de reserva confirmada: ${err.message}`
      );
    }
  }

  async sendReservaCancelada(reservationId: string): Promise<Notification> {
    try {
      const detail = await this.repository.findReservationDetail(reservationId);
      if (!detail) {
        throw new Error(`Reserva "${reservationId}" no encontrada.`);
      }

      return await this.sendAndRecord(
        detail,
        NotificationType.RESERVA_CANCELADA,
        "Tu reserva ha sido cancelada",
        this.buildReservaCanceladaHtml(detail)
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error en notificación de cancelación: ${err.message}`
      );
    }
  }

  async sendServicioIniciado(reservationId: string): Promise<Notification> {
    try {
      const detail = await this.repository.findReservationDetail(reservationId);
      if (!detail) {
        throw new Error(`Reserva "${reservationId}" no encontrada.`);
      }

      return await this.sendAndRecord(
        detail,
        NotificationType.SERVICIO_INICIADO,
        "El lavado de tu vehículo ha iniciado",
        this.buildServicioIniciadoHtml(detail)
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error en notificación de inicio de servicio: ${err.message}`
      );
    }
  }

  async sendServicioFinalizado(reservationId: string): Promise<Notification> {
    try {
      const detail = await this.repository.findReservationDetail(reservationId);
      if (!detail) {
        throw new Error(`Reserva "${reservationId}" no encontrada.`);
      }

      const feedbackUrl = `${process.env.FRONTEND_URL}/feedback/${reservationId}`;

      return await this.sendAndRecord(
        detail,
        NotificationType.SERVICIO_FINALIZADO,
        "¡Tu servicio ha finalizado!",
        this.buildServicioFinalizadoHtml(detail, feedbackUrl)
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error en notificación de fin de servicio: ${err.message}`
      );
    }
  }

  // ─── Cron: recordatorio 24h ───────────────────────────────────────────────

  async processRecordatorios24h(): Promise<void> {
    try {
      const reservations =
        await this.repository.findReservationsScheduledTomorrow();

      if (reservations.length === 0) {
        console.log("[NotificationService] Sin recordatorios para enviar hoy.");
        return;
      }

      console.log(
        `[NotificationService] Enviando ${reservations.length} recordatorio(s) de 24h...`
      );

      for (const detail of reservations) {
        try {
          await this.sendAndRecord(
            detail,
            NotificationType.RECORDATORIO_24H,
            "Recordatorio: tienes una reserva mañana",
            this.buildRecordatorio24hHtml(detail)
          );
        } catch (error) {
          // Loguear pero continuar con los demás recordatorios
          const err = error as Error;
          console.error(
            `[NotificationService] Error enviando recordatorio para reserva "${detail.id}": ${err.message}`
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error procesando recordatorios 24h: ${err.message}`
      );
    }
  }

  // ─── Cron: reporte diario para admin ─────────────────────────────────────

  async processDailyReport(): Promise<void> {
    try {
      const [rows, adminEmails] = await Promise.all([
        this.repository.findTodayReservations(),
        this.repository.findAdminEmails(),
      ]);

      if (adminEmails.length === 0) {
        console.warn("[NotificationService] No hay administradores registrados para enviar el reporte.");
        return;
      }

      const date = new Date().toLocaleDateString("es-CO", {
        timeZone: "America/Bogota",
      });

      const html = this.buildReporteDiarioHtml(rows, date);
      const subject =
        rows.length > 0
          ? `Reporte diario — ${rows.length} reserva(s) para hoy`
          : "Reporte diario — Sin reservas para hoy";

      for (const email of adminEmails) {
        try {
          await this.mailer.send({ to: email, subject, html });
          console.log(`[NotificationService] Reporte diario enviado a ${email}`);
        } catch (error) {
          const err = error as Error;
          console.error(
            `[NotificationService] Error enviando reporte a "${email}": ${err.message}`
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error procesando reporte diario: ${err.message}`
      );
    }
  }

  // ─── Cron: reintentar notificaciones fallidas ────────────────────────────

  async retryFailedNotifications(): Promise<void> {
    try {
      const failed = await this.repository.findFailedNotifications();

      if (failed.length === 0) return;

      console.log(
        `[NotificationService] Reintentando ${failed.length} notificación(es) fallida(s)...`
      );

      for (const notification of failed) {
        try {
          const detail = await this.repository.findReservationDetail(
            notification.reservation_id
          );
          if (!detail) continue;

          // Re-despachar según el tipo original
          switch (notification.type) {
            case NotificationType.RESERVA_CREADA:
              await this.sendReservaConfirmada(notification.reservation_id);
              break;
            case NotificationType.RESERVA_CANCELADA:
              await this.sendReservaCancelada(notification.reservation_id);
              break;
            case NotificationType.RECORDATORIO_24H:
              await this.sendAndRecord(
                detail,
                NotificationType.RECORDATORIO_24H,
                "Recordatorio: tienes una reserva mañana",
                this.buildRecordatorio24hHtml(detail)
              );
              break;
            case NotificationType.SERVICIO_INICIADO:
              await this.sendServicioIniciado(notification.reservation_id);
              break;
            case NotificationType.SERVICIO_FINALIZADO:
              await this.sendServicioFinalizado(notification.reservation_id);
              break;
            case NotificationType.RESERVA_CANCELADA:
              await this.sendReservaCancelada(notification.reservation_id);
              break;
            default:
              console.warn(
                `[NotificationService] Tipo de notificación desconocido en reintento: "${notification.type}"`
              );
          }
        } catch (error) {
          const err = error as Error;
          console.error(
            `[NotificationService] Reintento fallido para notificación "${notification.id}": ${err.message}`
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error en proceso de reintento: ${err.message}`
      );
    }
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  async submitFeedback(body: SubmitFeedbackBody): Promise<Feedback> {
    try {
      const { reservation_id, rating, feedback } = body;

      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new Error("La calificación debe ser un número entero entre 1 y 5.");
      }

      if (!feedback || feedback.trim().length === 0) {
        throw new Error("El comentario de feedback no puede estar vacío.");
      }

      const existing =
        await this.repository.findFeedbackByReservation(reservation_id);

      if (existing) {
        throw new Error(
          `Ya existe un feedback registrado para la reserva "${reservation_id}".`
        );
      }

      const detail =
        await this.repository.findReservationDetail(reservation_id);

      if (!detail) {
        throw new Error(`La reserva "${reservation_id}" no existe.`);
      }

      return await this.repository.createFeedback(
        reservation_id,
        rating,
        feedback.trim()
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[NotificationService] Error guardando feedback: ${err.message}`
      );
    }
  }
}

export default NotificationService;