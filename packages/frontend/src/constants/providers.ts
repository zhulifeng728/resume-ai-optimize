// 前端运行时用的 AI 服务商常量，与 shared/types 保持一致
export enum LlmProvider {
  NVIDIA_NIM = 'NVIDIA_NIM',
  DEEPSEEK = 'DEEPSEEK',
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  CUSTOM = 'CUSTOM',
}

export interface ProviderConfig {
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
}

export const PROVIDER_CONFIGS: Record<LlmProvider, ProviderConfig> = {
  [LlmProvider.NVIDIA_NIM]: {
    name: 'NVIDIA NIM',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.1-70b-instruct',
  },
  [LlmProvider.DEEPSEEK]: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  [LlmProvider.OPENAI]: {
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
  },
  [LlmProvider.CLAUDE]: {
    name: 'Claude',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-opus-4-6',
  },
  [LlmProvider.CUSTOM]: {
    name: '自定义',
    defaultBaseUrl: '',
    defaultModel: '',
  },
};

// 与 shared/types/resume.ts 保持一致
export enum ResumeStatus {
  UPLOADED = 'UPLOADED',
  PARSING = 'PARSING',
  PARSED = 'PARSED',
  PARSE_FAILED = 'PARSE_FAILED',
}
