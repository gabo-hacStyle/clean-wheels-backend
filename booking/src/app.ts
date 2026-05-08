import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import ReservationController from "./controller/reservationController";
import ServiceController from "./controller/serviceController";
import CategoryController from "./controller/categoryController";
import SystemController from "./controller/systemController";

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
    const reservationController = new ReservationController();
    const serviceController = new ServiceController();
    const systemController = new SystemController();
    this.app.use("/system", systemController.router);
    this.app.use("/reservations", reservationController.router);
    this.app.use("/services", serviceController.router);

    const categoryController = new CategoryController();
    this.app.use("/categories", categoryController.router);
  }

  private setErrorHandler(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(`[App] Error no manejado: ${err.message}`);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor.",
      });
    });
  }

  public getApp(): Application {
  return this.app;
}
}

export default App;