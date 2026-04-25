import { Router } from 'express';
import { authenticate, requireRole } from '@middleware/auth.middleware';
import { bookingProxy } from '../proxy/booking.proxy';

const router = Router();

router.use(authenticate, requireRole('CLIENT', 'ADMIN'), bookingProxy);

export default router;