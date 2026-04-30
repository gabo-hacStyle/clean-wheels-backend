import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { notificationsProxy } from '../proxy/notifications.proxy';

const router = Router();

router.use(authenticate, notificationsProxy);

export default router;
