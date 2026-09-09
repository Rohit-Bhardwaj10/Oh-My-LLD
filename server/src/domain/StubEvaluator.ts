import { Evaluator } from './Evaluator';
import { Problem, EvaluationResult, StageType } from './types';
import { Stage } from './Stage';

export class StubEvaluator implements Evaluator {
  async evaluate(stages: Stage[], problem: Problem): Promise<EvaluationResult[]> {
    // Return deterministic fake results
    return [
      {
        stageType: StageType.REQUIREMENTS,
        feedback: [
          {
            criterion: 'Completeness',
            score: 4,
            evidence: 'Mentioned core use cases.',
            concern: 'Missed some edge cases.',
            suggestion: 'Consider what happens when capacity is full.',
          },
        ],
      },
      {
        stageType: StageType.DESIGN,
        feedback: [
          {
            criterion: 'Responsibility',
            score: 5,
            evidence: 'Clear class responsibilities.',
            concern: 'None',
            suggestion: 'Keep up the good work.',
          },
        ],
      },
      {
        stageType: StageType.EXTENSION,
        feedback: [
          {
            criterion: 'Trade-offs',
            score: 3,
            evidence: 'Identified database bottleneck.',
            concern: 'Did not explain how to resolve it.',
            suggestion: 'Suggest caching or sharding strategies.',
          },
        ],
      },
    ];
  }
}
