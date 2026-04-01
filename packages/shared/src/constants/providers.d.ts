import { LlmProvider } from '../types/api-key';
export interface ProviderConfig {
    name: string;
    defaultBaseUrl: string;
    defaultModel: string;
    supportsStreaming: boolean;
}
export declare const PROVIDER_CONFIGS: Record<LlmProvider, ProviderConfig>;
