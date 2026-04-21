import { Router, Request, Response } from 'express';

const router = Router();

const response = {
  "status": 'Active',
}

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).send(response);
});

export default router;