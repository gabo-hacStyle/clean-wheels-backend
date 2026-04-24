import { Request, Response, NextFunction } from "express";
import { ApiResponse, GatewayUser, UserRole } from "../types";

// Extiende Request para que TypeScript conozca req.gatewayUser en toda la app
declare global {
  namespace Express {
    interface Request {
      gatewayUser?: GatewayUser;
    }
  }
}

// Parsea los headers que inyecta el API Gateway y los adjunta a req.gatewayUser.
// Si los headers no vienen, rechaza el request — significa que alguien
// está intentando llamar al MS directamente saltándose el gateway.
export const requireGatewayAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userId = req.headers["x-user-id"] as string | undefined;
    const userRole = req.headers["x-user-role"] as string | undefined;

    if (!userId || !userRole) {
      const response: ApiResponse<null> = {
        success: false,
        error:
          "Acceso denegado. Headers de autenticación ausentes. Asegúrese de acceder a través del API Gateway.",
      };
      res.status(401).json(response);
      return;
    }

    const validRoles = Object.values(UserRole) as string[];
    if (!validRoles.includes(userRole)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Rol inválido recibido del gateway: "${userRole}".`,
      };
      res.status(401).json(response);
      return;
    }

    req.gatewayUser = {
      id: userId,
      role: userRole as UserRole,
    };

    next();
  } catch (error) {
    const err = error as Error;
    const response: ApiResponse<null> = {
      success: false,
      error: `[AuthMiddleware] Error procesando autenticación: ${err.message}`,
    };
    res.status(500).json(response);
  }
};

// Middleware de autorización: solo admin pasa
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.gatewayUser?.role !== UserRole.ADMIN) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Acceso denegado. Se requiere rol de administrador.",
    };
    res.status(403).json(response);
    return;
  }
  next();
};