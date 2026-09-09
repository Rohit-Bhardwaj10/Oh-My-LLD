import { describe, it, expect } from 'vitest';
import { StubEvaluator } from '../../src/domain/StubEvaluator';
import { Stage } from '../../src/domain/Stage';
import { StageType, StageStatus } from '../../src/domain/types';

describe('StubEvaluator', () => {
  it('returns structured deterministic feedback', async () => {
    const evaluator = new StubEvaluator();
    
    // Create dummy stages (StubEvaluator ignores content anyway)
    const stages = [
      new Stage({ id: 's1', attemptId: '1', stageType: StageType.REQUIREMENTS, content: '...', status: StageStatus.EVALUATING, submittedAt: new Date() }),
      new Stage({ id: 's2', attemptId: '1', stageType: StageType.DESIGN, content: '...', status: StageStatus.EVALUATING, submittedAt: new Date() }),
      new Stage({ id: 's3', attemptId: '1', stageType: StageType.EXTENSION, content: '...', status: StageStatus.EVALUATING, submittedAt: new Date() }),
    ];
    
    // Problem is also ignored by stub
    const problem = { id: 'p1', title: 'Test', description: 'Test', requirements: [], constraints: [] };
    
    const results = await evaluator.evaluate(stages, problem);
    
    expect(results).toHaveLength(3);
    expect(results.find(r => r.stageType === StageType.REQUIREMENTS)?.feedback[0].score).toBe(4);
    expect(results.find(r => r.stageType === StageType.DESIGN)?.feedback[0].score).toBe(5);
    expect(results.find(r => r.stageType === StageType.EXTENSION)?.feedback[0].score).toBe(3);
    
    // Check structure of feedback
    const reqFeedback = results.find(r => r.stageType === StageType.REQUIREMENTS)!.feedback[0];
    expect(reqFeedback).toHaveProperty('criterion');
    expect(reqFeedback).toHaveProperty('evidence');
    expect(reqFeedback).toHaveProperty('concern');
    expect(reqFeedback).toHaveProperty('suggestion');
  });
});
