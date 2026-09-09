export enum StageType {
  REQUIREMENTS = 'REQUIREMENTS',
  DESIGN = 'DESIGN',
  EXTENSION = 'EXTENSION',
}

export enum StageStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  EVALUATING = 'EVALUATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum AttemptStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  EVALUATING = 'EVALUATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: any;
  constraints: any;
}

export interface StageData {
  id: string;
  attemptId: string;
  stageType: StageType;
  content: string;
  status: StageStatus;
  submittedAt: Date | null;
}

export interface AttemptData {
  id: string;
  problemId: string;
  learnerId: string;
  status: AttemptStatus;
}

export interface CriterionFeedback {
  criterion: string;
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
}

export interface EvaluationResult {
  stageType: StageType;
  feedback: CriterionFeedback[];
}
