import { LlmProvider } from '../types/api-key';

export interface ProviderConfig {
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  supportsStreaming: boolean;
}

export const PROVIDER_CONFIGS: Record<LlmProvider, ProviderConfig> = {
  [LlmProvider.NVIDIA_NIM]: {
    name: 'NVIDIA NIM',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.1-70b-instruct',
    supportsStreaming: true,
  },
  [LlmProvider.DEEPSEEK]: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    supportsStreaming: true,
  },
  [LlmProvider.OPENAI]: {
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    supportsStreaming: true,
  },
  [LlmProvider.CLAUDE]: {
    name: 'Claude',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    supportsStreaming: true,
  },
  [LlmProvider.CUSTOM]: {
    name: 'Custom',
    defaultBaseUrl: '',
    defaultModel: '',
    supportsStreaming: true,
  },
};
