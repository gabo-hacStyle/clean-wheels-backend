import { Router } from 'express';
import { requireAdmin, attachUser } from "@middleware/admin.middleware";
import {adminController} from "../controllers/admin.controller";

const router = Router();

router.use(requireAdmin, attachUser);

router.get("/feedback", adminController.getFeedback);
router.get("/incomes", adminController.getIncomes);

export default router;