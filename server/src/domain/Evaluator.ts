import { Problem, EvaluationResult } from './types';
import { Stage } from './Stage';

export interface Evaluator {
  evaluate(stages: Stage[], problem: Problem): Promise<EvaluationResult[]>;
}
