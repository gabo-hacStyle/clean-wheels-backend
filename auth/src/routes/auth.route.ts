import { Router } from 'express';
import { authController } from "../controllers/auth.controller";

// @ts-ignore
const router = new Router();

router.get('/google', authController.googleLogin);
router.post('/google/callback', authController.googleCallback);

router.get('/me', authController.me);

export default router;