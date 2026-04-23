import { Router } from "express";
import { authenticate, requireRole } from "@middleware/auth.middleware";
import { adminProxy } from "../proxy/admin.proxy";

const router = Router();

router.use(authenticate, requireRole('ADMIN'), adminProxy);

export default router;