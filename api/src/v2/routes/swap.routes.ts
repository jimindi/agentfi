import { Router } from 'express';
import { SwapController } from '../controllers/SwapController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const swapController = new SwapController(prisma);

const router = Router();

router.post('/swap', (req, res) => swapController.executeSwap(req, res));
router.get('/swap/:intentId', (req, res) => swapController.getSwapStatus(req, res));

export default router;
