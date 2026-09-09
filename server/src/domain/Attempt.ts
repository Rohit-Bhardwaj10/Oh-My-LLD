import { AttemptData, AttemptStatus, StageType } from './types';
import { Stage } from './Stage';
import { StatusMachine } from './StatusMachine';
import { createHash } from 'crypto';

export class Attempt {
  private readonly data: AttemptData;
  private readonly stages: Map<StageType, Stage>;

  constructor(data: AttemptData, stages: Stage[]) {
    this.data = { ...data };
    this.stages = new Map(stages.map((s) => [s.stageType, s]));

    if (this.stages.size !== 3) {
      throw new Error('Attempt must have exactly 3 stages (REQUIREMENTS, DESIGN, EXTENSION)');
    }
  }

  public get id(): string { return this.data.id; }
  public get problemId(): string { return this.data.problemId; }
  public get learnerId(): string { return this.data.learnerId; }
  public get status(): AttemptStatus { return this.data.status; }

  public getStage(type: StageType): Stage {
    const stage = this.stages.get(type);
    if (!stage) throw new Error(`Stage ${type} not found`);
    return stage;
  }

  public getAllStages(): Stage[] {
    return Array.from(this.stages.values());
  }

  public getOverallStatus(): AttemptStatus {
    const stageStatuses = this.getAllStages().map((s) => s.status);
    return StatusMachine.getAttemptStatusFromStages(stageStatuses);
  }

  public computeSubmissionHash(): string {
    const combinedContent = [
      this.getStage(StageType.REQUIREMENTS).content,
      this.getStage(StageType.DESIGN).content,
      this.getStage(StageType.EXTENSION).content,
    ].join('|');
    return createHash('sha256').update(combinedContent).digest('hex');
  }

  public toRecord(): AttemptData {
    return { ...this.data, status: this.getOverallStatus() };
  }
}
