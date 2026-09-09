import { Attempt } from './Attempt';
import { AttemptStatus } from './types';

export class SubmissionValidator {
  static validate(
    attempt: Attempt,
    previousHash?: string,
    minLength: number = 50
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Not Evaluating
    if (attempt.getOverallStatus() === AttemptStatus.EVALUATING) {
      errors.push('Attempt is currently being evaluated and cannot be submitted.');
    }

    // 2. Not Empty / Meets minimum length
    const stages = attempt.getAllStages();
    for (const stage of stages) {
      if (!stage.content || stage.content.trim().length < minLength) {
        errors.push(`Stage ${stage.stageType} content must be at least ${minLength} characters.`);
      }
    }

    // 3. Not Duplicate
    if (previousHash) {
      const currentHash = attempt.computeSubmissionHash();
      if (currentHash === previousHash) {
        errors.push('Submission is identical to the previous attempt.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
