import { Evaluator } from './Evaluator';
import { Problem, EvaluationResult, StageType } from './types';
import { Stage } from './Stage';
import Groq from 'groq-sdk';

export class EvaluationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationParseError';
  }
}

export class LLMEvaluator implements Evaluator {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async evaluate(stages: Stage[], problem: Problem): Promise<EvaluationResult[]> {
    const prompt = this.buildPrompt(stages, problem);

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert software architect evaluating Low-Level Design (LLD) submissions. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama3-70b-8192', // or appropriate Groq model
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new EvaluationParseError('No response content from LLM');
    }

    return this.parseResponse(responseContent);
  }

  private buildPrompt(stages: Stage[], problem: Problem): string {
    const requirements = stages.find(s => s.stageType === StageType.REQUIREMENTS)?.content || '';
    const design = stages.find(s => s.stageType === StageType.DESIGN)?.content || '';
    const extension = stages.find(s => s.stageType === StageType.EXTENSION)?.content || '';

    return `
      Evaluate the following Low-Level Design (LLD) submission.
      
      Problem Title: ${problem.title}
      Problem Description: ${problem.description}
      Problem Requirements: ${JSON.stringify(problem.requirements)}
      Problem Constraints: ${JSON.stringify(problem.constraints)}

      Learner Submission:
      [REQUIREMENTS AND ASSUMPTIONS]
      ${requirements}

      [CLASS DESIGN]
      ${design}

      [EXTENSION AND TRADE-OFFS]
      ${extension}

      Evaluate each of the three stages based on standard software engineering principles (SOLID, coupling/cohesion, edge case coverage, etc.).
      
      Respond with a JSON object strictly matching this schema:
      {
        "results": [
          {
            "stageType": "REQUIREMENTS" | "DESIGN" | "EXTENSION",
            "feedback": [
              {
                "criterion": "string (e.g., Completeness, Responsibility)",
                "score": number (1 to 5),
                "evidence": "string (quote or reference to learner's text)",
                "concern": "string (what is wrong or missing)",
                "suggestion": "string (how to improve)"
              }
            ]
          }
        ]
      }
    `;
  }

  private parseResponse(content: string): EvaluationResult[] {
    try {
      const parsed = JSON.parse(content);
      if (!parsed || !Array.isArray(parsed.results)) {
        throw new Error('Missing or invalid "results" array in JSON response');
      }
      return parsed.results as EvaluationResult[];
    } catch (error: any) {
      throw new EvaluationParseError(`Failed to parse LLM evaluation: ${error.message}`);
    }
  }
}
