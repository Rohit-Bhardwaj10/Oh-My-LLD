import { Router, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma, auth } from '../auth';

const router = Router();

// Helper to get the current session from the request
async function getSession(req: Request) {
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}

// POST /api/attempts — create attempt + 3 stage rows
router.post('/', async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { problemId } = req.body;
  if (!problemId) {
    res.status(400).json({ error: 'problemId is required' });
    return;
  }

  try {
    // Verify the problem exists
    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // Create attempt with all 3 stages in one transaction
    const attempt = await prisma.attempt.create({
      data: {
        problemId,
        learnerId: session.user.id,
        status: 'DRAFT',
        stages: {
          create: [
            { stageType: 'REQUIREMENTS', content: '', status: 'DRAFT' },
            { stageType: 'DESIGN', content: '', status: 'DRAFT' },
            { stageType: 'EXTENSION', content: '', status: 'DRAFT' },
          ],
        },
      },
      include: { stages: true },
    });

    res.status(201).json({ attempt });
  } catch (err) {
    console.error('[POST /api/attempts]', err);
    res.status(500).json({ error: 'Failed to create attempt' });
  }
});

// GET /api/attempts/:id — get attempt with stages + evaluation
router.get('/:id', async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageType: 'asc' } },
        evaluation: true,
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    // Ensure the learner can only see their own attempt
    if (attempt.learnerId !== session.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ attempt });
  } catch (err) {
    console.error(`[GET /api/attempts/${id}]`, err);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

// PUT /api/attempts/:id/stages — update a single stage's content
router.put('/:id/stages', async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { stageType, content } = req.body;

  if (!stageType || content === undefined) {
    res.status(400).json({ error: 'stageType and content are required' });
    return;
  }

  try {
    // Verify ownership
    const attempt = await prisma.attempt.findUnique({ where: { id } });
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }
    if (attempt.learnerId !== session.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Find the stage
    const stage = await prisma.stage.findFirst({
      where: { attemptId: id, stageType },
    });

    if (!stage) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    // Only allow edits in DRAFT or FAILED status
    if (stage.status !== 'DRAFT' && stage.status !== 'FAILED') {
      res.status(409).json({ error: `Stage cannot be edited in status ${stage.status}` });
      return;
    }

    const updated = await prisma.stage.update({
      where: { id: stage.id },
      data: { content },
    });

    res.json({ stage: updated });
  } catch (err) {
    console.error(`[PUT /api/attempts/${id}/stages]`, err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

export default router;
