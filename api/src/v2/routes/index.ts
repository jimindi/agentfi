import { Router } from 'express';
import swapRoutes from './swap.routes';

const router = Router();

// Mount swap routes
router.use('/swap', swapRoutes);

export default router;
