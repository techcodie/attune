import type {
  AnswerAnalysis,
  EvaluateAnswerInput,
  EvaluateInterviewInput,
  GenerateResponseInput,
  InterviewAssessment,
  LLMProvider,
  SummarizeInput,
} from './types.js';

/**
 * Placeholder. OpenAI's chat API is response-compatible with the Groq path, so
 * a real implementation reuses the same prompt builders and parseAnalysis with
 * an OpenAI client built from OPENAI_API_KEY. Not implemented on purpose.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';

  constructor(_apiKey: string, _model: string) {}

  private notImplemented(): never {
    throw new Error('OpenAIProvider is a placeholder. Set LLM_PROVIDER=groq (or mock).');
  }

  evaluateAnswer(_input: EvaluateAnswerInput): Promise<AnswerAnalysis> {
    return this.notImplemented();
  }
  summarizeConversation(_input: SummarizeInput): Promise<string> {
    return this.notImplemented();
  }
  generateInterviewResponse(_input: GenerateResponseInput): Promise<string> {
    return this.notImplemented();
  }
  evaluateInterview(_input: EvaluateInterviewInput): Promise<InterviewAssessment> {
    return this.notImplemented();
  }
}
