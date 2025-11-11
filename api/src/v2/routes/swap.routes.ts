import { Router } from 'express';
import { SwapController } from '../controllers/SwapController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const swapController = new SwapController(prisma);

const router = Router();

// Routes are mounted at /v2/swap, so these are:
// POST /v2/swap
// GET /v2/swap/:intentId
router.post('/', (req, res) => swapController.executeSwap(req, res));
router.get('/:intentId', (req, res) => swapController.getSwapStatus(req, res));

export default router;
