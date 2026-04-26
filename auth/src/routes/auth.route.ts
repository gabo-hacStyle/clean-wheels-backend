import { Router } from 'express';
import { authController } from "../controllers/auth.controller";
import {authenticate} from "@middleware/authenticate.middleware";

const router = Router();

router.get('/google/url', authController.googleLogin);
router.post('/google/callback', authController.googleCallback);

router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, authController.updateProfile)

export default router;