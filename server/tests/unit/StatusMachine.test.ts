import { describe, it, expect } from 'vitest';
import { StatusMachine } from '../../src/domain/StatusMachine';
import { StageStatus, AttemptStatus } from '../../src/domain/types';

describe('StatusMachine', () => {
  describe('canTransition', () => {
    it('allows DRAFT -> SUBMITTED', () => {
      expect(StatusMachine.canTransition(StageStatus.DRAFT, StageStatus.SUBMITTED)).toBe(true);
    });

    it('rejects DRAFT -> COMPLETED', () => {
      expect(StatusMachine.canTransition(StageStatus.DRAFT, StageStatus.COMPLETED)).toBe(false);
    });

    it('allows SUBMITTED -> EVALUATING', () => {
      expect(StatusMachine.canTransition(StageStatus.SUBMITTED, StageStatus.EVALUATING)).toBe(true);
    });

    it('rejects SUBMITTED -> DRAFT', () => {
      expect(StatusMachine.canTransition(StageStatus.SUBMITTED, StageStatus.DRAFT)).toBe(false);
    });

    it('allows EVALUATING -> COMPLETED', () => {
      expect(StatusMachine.canTransition(StageStatus.EVALUATING, StageStatus.COMPLETED)).toBe(true);
    });

    it('allows EVALUATING -> FAILED', () => {
      expect(StatusMachine.canTransition(StageStatus.EVALUATING, StageStatus.FAILED)).toBe(true);
    });

    it('rejects COMPLETED -> any', () => {
      expect(StatusMachine.canTransition(StageStatus.COMPLETED, StageStatus.DRAFT)).toBe(false);
      expect(StatusMachine.canTransition(StageStatus.COMPLETED, StageStatus.EVALUATING)).toBe(false);
    });

    it('allows FAILED -> EVALUATING (retry)', () => {
      expect(StatusMachine.canTransition(StageStatus.FAILED, StageStatus.EVALUATING)).toBe(true);
    });
  });

  describe('getAttemptStatusFromStages', () => {
    it('returns DRAFT if empty', () => {
      expect(StatusMachine.getAttemptStatusFromStages([])).toBe(AttemptStatus.DRAFT);
    });

    it('returns FAILED if any stage failed', () => {
      expect(StatusMachine.getAttemptStatusFromStages([StageStatus.COMPLETED, StageStatus.FAILED, StageStatus.COMPLETED])).toBe(AttemptStatus.FAILED);
    });

    it('returns EVALUATING if any stage is evaluating (and none failed)', () => {
      expect(StatusMachine.getAttemptStatusFromStages([StageStatus.COMPLETED, StageStatus.EVALUATING, StageStatus.COMPLETED])).toBe(AttemptStatus.EVALUATING);
    });

    it('returns COMPLETED if all are completed', () => {
      expect(StatusMachine.getAttemptStatusFromStages([StageStatus.COMPLETED, StageStatus.COMPLETED, StageStatus.COMPLETED])).toBe(AttemptStatus.COMPLETED);
    });

    it('returns SUBMITTED if some are submitted (and none evaluating/failed)', () => {
      expect(StatusMachine.getAttemptStatusFromStages([StageStatus.SUBMITTED, StageStatus.COMPLETED, StageStatus.COMPLETED])).toBe(AttemptStatus.SUBMITTED);
    });

    it('returns DRAFT if no other higher priority status matches (e.g., all DRAFT)', () => {
      expect(StatusMachine.getAttemptStatusFromStages([StageStatus.DRAFT, StageStatus.DRAFT, StageStatus.DRAFT])).toBe(AttemptStatus.DRAFT);
    });
  });
});
