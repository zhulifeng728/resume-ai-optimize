export interface AiCompletionRequest {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OptimizationRequest {
  resumeId: string;
  jobId: string;
  apiKeyId: string;
}

export interface OptimizationResult {
  id: string;
  resumeVersionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}
