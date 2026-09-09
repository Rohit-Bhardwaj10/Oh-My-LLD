import { Router, Request, Response } from 'express';
import { prisma } from '../auth';

const router = Router();

// GET /api/problems — list all problems
router.get('/', async (req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        constraints: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ problems });
  } catch (err) {
    console.error('[GET /api/problems]', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET /api/problems/:id — single problem with full requirements
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const problem = await prisma.problem.findUnique({
      where: { id },
    });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }
    res.json({ problem });
  } catch (err) {
    console.error(`[GET /api/problems/${id}]`, err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

export default router;
