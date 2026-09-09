import { Router, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma, auth } from '../auth';

const router = Router();

// Helper to get the current session from the request
async function getSession(req: Request) {
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}

// GET /api/attempts — list attempts for a user (optionally filtered by problemId)
router.get('/', async (req: Request, res: Response) => {
  const session = await getSession(req);
  console.log('[GET /api/attempts] session:', session ? session.user.id : 'null');
  
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { problemId } = req.query;
  const whereClause: any = { learnerId: session.user.id };
  
  if (problemId && typeof problemId === 'string') {
    whereClause.problemId = problemId;
  }

  try {
    const attempts = await prisma.attempt.findMany({
      where: whereClause,
      include: {
        evaluation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map attempts to include a total score if they have an evaluation
    const mappedAttempts = attempts.map((a) => {
      let totalScore = null;
      if (a.evaluation?.results) {
        const results = a.evaluation.results as any[];
        totalScore = results.reduce((acc, curr) => acc + (curr.feedback?.[0]?.score || 0), 0);
      }
      return {
        id: a.id,
        problemId: a.problemId,
        status: a.status,
        createdAt: a.createdAt,
        totalScore,
      };
    });

    res.json({ attempts: mappedAttempts });
  } catch (err) {
    console.error('[GET /api/attempts]', err);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

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

// POST /api/attempts/:id/submit — validate, evaluate, and persist
router.post('/:id/submit', async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    // 1. Load attempt with stages and problem
    const raw = await prisma.attempt.findUnique({
      where: { id },
      include: {
        stages: true,
        problem: true,
        evaluation: true,
      },
    });

    if (!raw) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }
    if (raw.learnerId !== session.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (raw.status === 'EVALUATING') {
      res.status(409).json({ error: 'Already evaluating' });
      return;
    }

    // 2. Basic content check — each stage must have >50 non-whitespace chars
    const MIN_CHARS = 50;
    const thin = raw.stages.filter(
      (s) => !s.content || s.content.replace(/\/\/.*$/gm, '').trim().length < MIN_CHARS
    );
    if (thin.length > 0) {
      res.status(422).json({
        error: 'Each section must have at least 50 characters of real content.',
        stages: thin.map((s) => s.stageType),
      });
      return;
    }

    // 3. Mark as EVALUATING
    await prisma.attempt.update({ where: { id }, data: { status: 'EVALUATING' } });

    // 4. Call LLM evaluator
    const { LLMEvaluator } = await import('../domain/LLMEvaluator');
    const evaluator = new LLMEvaluator(process.env.GROQ_API_KEY!);

    const problem = {
      id: raw.problem.id,
      title: raw.problem.title,
      description: raw.problem.description,
      requirements: raw.problem.requirements as string[],
      constraints: raw.problem.constraints as string[],
    };

    const stages = raw.stages.map((s) => ({
      stageType: s.stageType as any,
      content: s.content,
      status: s.status as any,
    }));

    const results = await evaluator.evaluate(stages as any, problem);

    // 5. Persist evaluation (upsert in case of retry)
    const evaluation = await prisma.evaluation.upsert({
      where: { attemptId: id },
      create: { attemptId: id, results: results as any },
      update: { results: results as any },
    });

    // 6. Mark attempt COMPLETED and all stages COMPLETED
    await prisma.$transaction([
      prisma.attempt.update({ where: { id }, data: { status: 'COMPLETED' } }),
      ...raw.stages.map((s) =>
        prisma.stage.update({ where: { id: s.id }, data: { status: 'COMPLETED', submittedAt: new Date() } })
      ),
    ]);

    res.json({ evaluation });
  } catch (err: any) {
    console.error(`[POST /api/attempts/${id}/submit]`, err);
    // Mark as FAILED if evaluation errored
    await prisma.attempt.update({ where: { id }, data: { status: 'FAILED' } }).catch(() => {});
    res.status(500).json({ error: 'Evaluation failed. Please try again.', detail: err.message });
  }
});

export default router;

