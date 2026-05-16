import cron from "node-cron";
import NotificationService from "../service/notification";

class NotificationScheduler {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  public start(): void {
    try {
      // Recordatorios 24h — todos los días a las 8:00 AM (hora Colombia)
      cron.schedule(
        "0 8 * * *",
        async () => {
          console.log("[Scheduler] Ejecutando recordatorios 24h...");
          try {
            await this.service.processRecordatorios24h();
          } catch (error) {
            const err = error as Error;
            console.error(
              `[Scheduler] Error en job de recordatorios 24h: ${err.message}`
            );
          }
        },
        { timezone: "America/Bogota" }
      );

      // Reporte diario para admin — todos los días a las 6:00 AM, 10:00 AM, 11:00 AM y 9:00 PM
      cron.schedule(
        "0 6,10,11,12 * * *",
        async () => {
          console.log("[Scheduler] Ejecutando reporte diario...");
          try {
            await this.service.processDailyReport();
          } catch (error) {
            const err = error as Error;
            console.error(
              `[Scheduler] Error en job de reporte diario: ${err.message}`
            );
          }
        },
        { timezone: "America/Bogota" }
      );

      // Reintento de notificaciones fallidas — cada 5 minutos
      cron.schedule(
        "*/5 * * * *",
        async () => {
          try {
            await this.service.retryFailedNotifications();
          } catch (error) {
            const err = error as Error;
            console.error(
              `[Scheduler] Error en job de reintento: ${err.message}`
            );
          }
        },
        { timezone: "America/Bogota" }
      );

      // Servicios iniciados — cada hora de lunes a sabado, 6 AM a 6 PM (hora Colombia)
      cron.schedule(
        "0 6-18 * * 1-6",
        async () => {
          console.log("[Scheduler] Ejecutando procesamiento de servicios iniciados...");
          try {
            await this.service.processServicesStartedCurrentHour();
          } catch (error) {
            const err = error as Error;
            console.error(
              `[Scheduler] Error en job de servicios iniciados: ${err.message}`
            );
          }
        },
        { timezone: "America/Bogota" }
      );

      console.log("[Scheduler] Todos los cron jobs iniciados correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[Scheduler] Error iniciando cron jobs: ${err.message}`
      );
    }
  }
}

export default NotificationScheduler;