import { Router } from 'express';
import { authProxy } from '../proxy/auth.proxy';

const router = Router();

router.use(authProxy);

export default router;
