import { Router, Request, Response } from "express";

class SystemController {
  public router: Router;
  

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  

  private initRoutes(): void {
    // GET /health
    this.router.get("/health", (_req: Request, res: Response) => {
      return res.status(200).json({
        success: true,
      });
    });
  }

 
}

export default SystemController;