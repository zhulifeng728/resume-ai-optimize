export interface LlmCompletionOptions {
  apiKey: string;
  baseUrl?: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmCompletionResult {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export abstract class BaseLlmProvider {
  abstract complete(options: LlmCompletionOptions): Promise<LlmCompletionResult>;
  abstract completeStream(options: LlmCompletionOptions): AsyncIterable<string>;
}
