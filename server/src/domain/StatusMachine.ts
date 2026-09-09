import { StageStatus, AttemptStatus } from './types';

export class StatusMachine {
  private static readonly VALID_TRANSITIONS: Record<StageStatus, Set<StageStatus>> = {
    [StageStatus.DRAFT]: new Set([StageStatus.SUBMITTED]),
    [StageStatus.SUBMITTED]: new Set([StageStatus.EVALUATING]),
    [StageStatus.EVALUATING]: new Set([StageStatus.COMPLETED, StageStatus.FAILED]),
    [StageStatus.COMPLETED]: new Set(), // terminal
    [StageStatus.FAILED]: new Set([StageStatus.EVALUATING]), // retry
  };

  static canTransition(from: StageStatus, to: StageStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.has(to);
  }

  static assertTransition(from: StageStatus, to: StageStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
  }

  static getAttemptStatusFromStages(stageStatuses: StageStatus[]): AttemptStatus {
    if (stageStatuses.length === 0) return AttemptStatus.DRAFT;

    const hasFailed = stageStatuses.some((s) => s === StageStatus.FAILED);
    if (hasFailed) return AttemptStatus.FAILED;

    const hasEvaluating = stageStatuses.some((s) => s === StageStatus.EVALUATING);
    if (hasEvaluating) return AttemptStatus.EVALUATING;

    const allCompleted = stageStatuses.every((s) => s === StageStatus.COMPLETED);
    if (allCompleted) return AttemptStatus.COMPLETED;

    const hasSubmitted = stageStatuses.some((s) => s === StageStatus.SUBMITTED);
    if (hasSubmitted) return AttemptStatus.SUBMITTED;

    return AttemptStatus.DRAFT;
  }
}
