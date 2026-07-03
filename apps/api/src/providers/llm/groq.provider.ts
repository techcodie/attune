import Groq from 'groq-sdk';
import type {
  AnswerAnalysis,
  EvaluateAnswerInput,
  EvaluateInterviewInput,
  GenerateResponseInput,
  InterviewAssessment,
  LLMProvider,
  SummarizeInput,
} from './types.js';
import { parseAnalysis } from './parseAnalysis.js';
import { parseAssessment } from './parseAssessment.js';
import { buildEvaluatePrompt } from '../../prompts/evaluate.prompt.js';
import { buildSummarizePrompt } from '../../prompts/summarize.prompt.js';
import { buildRespondPrompt } from '../../prompts/respond.prompt.js';
import { buildEvaluateInterviewPrompt } from '../../prompts/evaluateInterview.prompt.js';
import type { PromptMessage } from '../../prompts/shared.js';

/**
 * The default, functional provider. Groq serves OpenAI-compatible chat
 * completions at very low latency — ideal for a real-time interview loop and
 * generous on the free tier. All Groq-specific code stays inside this file.
 */
export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private readonly client: Groq;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Groq({ apiKey });
  }

  private async chat(
    messages: PromptMessage[],
    opts: { json?: boolean; temperature?: number; maxTokens?: number } = {},
  ): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 400,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    });
    return res.choices[0]?.message?.content?.trim() ?? '';
  }

  async evaluateAnswer(input: EvaluateAnswerInput): Promise<AnswerAnalysis> {
    const raw = await this.chat(buildEvaluatePrompt(input), {
      json: true,
      temperature: 0.2,
      maxTokens: 600,
    });
    return parseAnalysis(raw);
  }

  async summarizeConversation(input: SummarizeInput): Promise<string> {
    const summary = await this.chat(buildSummarizePrompt(input), {
      temperature: 0.3,
      maxTokens: 250,
    });
    return summary || input.previousSummary;
  }

  async generateInterviewResponse(input: GenerateResponseInput): Promise<string> {
    return this.chat(buildRespondPrompt(input), { temperature: 0.7, maxTokens: 220 });
  }

  async evaluateInterview(input: EvaluateInterviewInput): Promise<InterviewAssessment> {
    const raw = await this.chat(buildEvaluateInterviewPrompt(input), {
      json: true,
      temperature: 0.3,
      maxTokens: 2000,
    });
    return parseAssessment(raw, input.config.interviewType);
  }
}
