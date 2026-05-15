import { Router } from 'express';
import { authenticate, requireRole } from '@middleware/auth.middleware';
import { bookingProxy } from '../proxy/booking.proxy';

const router = Router();

router.get('/system/health', bookingProxy);
router.use(authenticate, requireRole('CLIENT', 'ADMIN', 'GUEST'), bookingProxy);

export default router;
