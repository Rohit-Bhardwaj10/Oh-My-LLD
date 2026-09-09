import { StageData, StageStatus, StageType } from './types';
import { StatusMachine } from './StatusMachine';
import { createHash } from 'crypto';

export class Stage {
  private readonly data: StageData;

  constructor(data: StageData) {
    this.data = { ...data };
  }

  public get id(): string { return this.data.id; }
  public get attemptId(): string { return this.data.attemptId; }
  public get stageType(): StageType { return this.data.stageType; }
  public get content(): string { return this.data.content; }
  public get status(): StageStatus { return this.data.status; }
  public get submittedAt(): Date | null { return this.data.submittedAt; }

  public withContent(newContent: string): Stage {
    if (this.status !== StageStatus.DRAFT && this.status !== StageStatus.FAILED) {
      throw new Error(`Cannot update content of stage in status ${this.status}`);
    }
    return new Stage({ ...this.data, content: newContent });
  }

  public transitionTo(nextStatus: StageStatus): Stage {
    StatusMachine.assertTransition(this.status, nextStatus);
    const updates: Partial<StageData> = { status: nextStatus };
    if (nextStatus === StageStatus.SUBMITTED) {
      updates.submittedAt = new Date();
    }
    return new Stage({ ...this.data, ...updates });
  }

  public computeContentHash(): string {
    return createHash('sha256').update(this.content).digest('hex');
  }

  public toRecord(): StageData {
    return { ...this.data };
  }
}
