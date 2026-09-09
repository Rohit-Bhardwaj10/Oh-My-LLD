import { describe, it, expect } from 'vitest';
import { Stage } from '../../src/domain/Stage';
import { StageStatus, StageType } from '../../src/domain/types';

describe('Stage', () => {
  const defaultData = {
    id: '1',
    attemptId: 'a1',
    stageType: StageType.REQUIREMENTS,
    content: '',
    status: StageStatus.DRAFT,
    submittedAt: null,
  };

  it('can update content when DRAFT', () => {
    const stage = new Stage(defaultData);
    const updated = stage.withContent('New requirements');
    expect(updated.content).toBe('New requirements');
    expect(stage.content).toBe(''); // Immutable check
  });

  it('can update content when FAILED (retry)', () => {
    const stage = new Stage({ ...defaultData, status: StageStatus.FAILED });
    const updated = stage.withContent('Fixed requirements');
    expect(updated.content).toBe('Fixed requirements');
  });

  it('throws when updating content in other statuses', () => {
    const stage = new Stage({ ...defaultData, status: StageStatus.SUBMITTED });
    expect(() => stage.withContent('Try change')).toThrow(/Cannot update content/);
  });

  it('transitions to valid next status', () => {
    const stage = new Stage(defaultData);
    const submitted = stage.transitionTo(StageStatus.SUBMITTED);
    expect(submitted.status).toBe(StageStatus.SUBMITTED);
    expect(submitted.submittedAt).not.toBeNull();
  });

  it('throws on invalid transition', () => {
    const stage = new Stage(defaultData);
    expect(() => stage.transitionTo(StageStatus.COMPLETED)).toThrow(/Invalid status transition/);
  });

  it('computes content hash consistently', () => {
    const stage1 = new Stage({ ...defaultData, content: 'Hello' });
    const stage2 = new Stage({ ...defaultData, content: 'Hello' });
    const stage3 = new Stage({ ...defaultData, content: 'World' });
    
    expect(stage1.computeContentHash()).toBe(stage2.computeContentHash());
    expect(stage1.computeContentHash()).not.toBe(stage3.computeContentHash());
  });
});
