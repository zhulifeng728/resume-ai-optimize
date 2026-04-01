export declare enum LlmProvider {
    NVIDIA_NIM = "NVIDIA_NIM",
    DEEPSEEK = "DEEPSEEK",
    OPENAI = "OPENAI",
    CLAUDE = "CLAUDE",
    CUSTOM = "CUSTOM"
}
export interface ApiKey {
    id: string;
    userId: string;
    provider: LlmProvider;
    name: string;
    baseUrl: string | null;
    modelId: string | null;
    maskedKey: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateApiKeyDto {
    provider: LlmProvider;
    name: string;
    apiKey: string;
    baseUrl?: string;
    modelId?: string;
}
export interface UpdateApiKeyDto {
    name?: string;
    baseUrl?: string;
    modelId?: string;
    isDefault?: boolean;
}
