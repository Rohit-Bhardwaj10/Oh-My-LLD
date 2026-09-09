import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMEvaluator, EvaluationParseError } from '../../src/domain/LLMEvaluator';
import { StageType, AttemptStatus, StageStatus } from '../../src/domain/types';

const mockCreate = vi.fn();

// Mock the Groq SDK
vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('LLMEvaluator', () => {
  let evaluator: LLMEvaluator;

  beforeEach(() => {
    vi.clearAllMocks();
    evaluator = new LLMEvaluator('fake-api-key');
  });

  const mockProblem = {
    id: 'problem-1',
    title: 'Parking Lot',
    description: 'Design a parking lot.',
    requirements: ['Support multiple floors'],
    constraints: [],
    createdAt: new Date(),
  };

  const mockStages = [
    {
      id: 's1',
      attemptId: 'a1',
      stageType: StageType.REQUIREMENTS,
      content: 'Reqs content',
      status: StageStatus.COMPLETED,
    },
    {
      id: 's2',
      attemptId: 'a1',
      stageType: StageType.DESIGN,
      content: 'Design content',
      status: StageStatus.COMPLETED,
    },
    {
      id: 's3',
      attemptId: 'a1',
      stageType: StageType.EXTENSION,
      content: 'Extension content',
      status: StageStatus.COMPLETED,
    },
  ];

  it('should successfully evaluate and parse a valid JSON response from Groq', async () => {
    const fakeJsonResponse = {
      results: [
        {
          stageType: 'REQUIREMENTS',
          feedback: [
            {
              criterion: 'Completeness',
              score: 4,
              evidence: 'Covered floors well',
              concern: 'Missed handicap spots',
              suggestion: 'Add handicap requirement',
            }
          ]
        }
      ]
    };

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(fakeJsonResponse)
          }
        }
      ]
    });

    const result = await evaluator.evaluate(mockStages as any, mockProblem);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].stageType).toBe('REQUIREMENTS');
    expect(result[0].feedback[0].score).toBe(4);
  });

  it('should throw EvaluationParseError if Groq returns no content', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: null } }
      ]
    });

    await expect(evaluator.evaluate(mockStages as any, mockProblem)).rejects.toThrow(EvaluationParseError);
    await expect(evaluator.evaluate(mockStages as any, mockProblem)).rejects.toThrow('No response content from LLM');
  });

  it('should throw EvaluationParseError if Groq returns invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: '{ invalid json ]' } }
      ]
    });

    await expect(evaluator.evaluate(mockStages as any, mockProblem)).rejects.toThrow(EvaluationParseError);
  });

  it('should throw EvaluationParseError if Groq returns valid JSON but missing "results" array', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify({ feedback: [] }) } }
      ]
    });

    await expect(evaluator.evaluate(mockStages as any, mockProblem)).rejects.toThrow(EvaluationParseError);
    await expect(evaluator.evaluate(mockStages as any, mockProblem)).rejects.toThrow('Missing or invalid "results" array in JSON response');
  });
});
