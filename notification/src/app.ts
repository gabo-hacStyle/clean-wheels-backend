import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import NotificationController from "./controllers/notification";
import NotificationScheduler from "./scheduler/notification.scheduler";
import RabbitMQClient from "./infraestructure/rabbitmq.client";
import Mailer from "./infraestructure/mailer";

dotenv.config();

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandler();
  }

  private setMiddlewares(): void {
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
  }

  private setRoutes(): void {
    const notificationController = new NotificationController();
    this.app.use("/notifications", notificationController.router);
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'api-gateway' });
    });
  }

  private setErrorHandler(): void {
    this.app.use(
      (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(`[App] Error no manejado: ${err.message}`);
        res.status(500).json({ success: false, error: "Error interno del servidor." });
      }
    );
  }

  // Inicializar infraestructura async (RabbitMQ, Mailer, Scheduler)
  // Se llama desde bin/www.ts después de levantar el servidor HTTP
  public async initInfrastructure(): Promise<void> {
    try {
      await Mailer.getInstance().verify();
      await RabbitMQClient.getInstance().connect();
      new NotificationScheduler().start();
      console.log("[App] Infraestructura iniciada correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(`[App] Error iniciando infraestructura: ${err.message}`);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;