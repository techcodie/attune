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
 * Placeholder. Wiring is identical to GroqProvider — construct a Gemini client
 * from GEMINI_API_KEY and reuse the shared prompt builders + parseAnalysis.
 * Left unimplemented on purpose: only one functional provider is required, and
 * this proves the abstraction is genuinely plug-and-play.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';

  constructor(_apiKey: string, _model: string) {}

  private notImplemented(): never {
    throw new Error('GeminiProvider is a placeholder. Set LLM_PROVIDER=groq (or mock).');
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
