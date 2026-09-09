import { describe, it, expect } from 'vitest';
import { SubmissionValidator } from '../../src/domain/SubmissionValidator';
import { Attempt } from '../../src/domain/Attempt';
import { Stage } from '../../src/domain/Stage';
import { AttemptStatus, StageStatus, StageType } from '../../src/domain/types';

describe('SubmissionValidator', () => {
  const createValidAttempt = () => {
    return new Attempt(
      { id: '1', problemId: 'p1', learnerId: 'l1', status: AttemptStatus.DRAFT },
      [
        new Stage({ id: 's1', attemptId: '1', stageType: StageType.REQUIREMENTS, content: 'a'.repeat(50), status: StageStatus.DRAFT, submittedAt: null }),
        new Stage({ id: 's2', attemptId: '1', stageType: StageType.DESIGN, content: 'b'.repeat(50), status: StageStatus.DRAFT, submittedAt: null }),
        new Stage({ id: 's3', attemptId: '1', stageType: StageType.EXTENSION, content: 'c'.repeat(50), status: StageStatus.DRAFT, submittedAt: null }),
      ]
    );
  };

  it('passes on valid attempt', () => {
    const attempt = createValidAttempt();
    const result = SubmissionValidator.validate(attempt);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('fails if currently evaluating', () => {
    const attempt = createValidAttempt();
    const evaluatingAttempt = new Attempt(
      { id: '1', problemId: 'p1', learnerId: 'l1', status: AttemptStatus.EVALUATING },
      attempt.getAllStages().map(s => s.transitionTo(StageStatus.SUBMITTED).transitionTo(StageStatus.EVALUATING))
    );
    const result = SubmissionValidator.validate(evaluatingAttempt);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Attempt is currently being evaluated and cannot be submitted.');
  });

  it('fails if content is too short', () => {
    const attempt = createValidAttempt();
    const shortStage = attempt.getStage(StageType.REQUIREMENTS).withContent('too short');
    const invalidAttempt = new Attempt(
      { id: '1', problemId: 'p1', learnerId: 'l1', status: AttemptStatus.DRAFT },
      [shortStage, attempt.getStage(StageType.DESIGN), attempt.getStage(StageType.EXTENSION)]
    );
    const result = SubmissionValidator.validate(invalidAttempt);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/must be at least 50 characters/);
  });

  it('fails if duplicate submission (hashes match)', () => {
    const attempt = createValidAttempt();
    const hash = attempt.computeSubmissionHash();
    
    // Validate with the exact same hash as previous
    const result = SubmissionValidator.validate(attempt, hash);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Submission is identical to the previous attempt.');
  });
});
