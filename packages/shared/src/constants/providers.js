"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_CONFIGS = void 0;
const api_key_1 = require("../types/api-key");
exports.PROVIDER_CONFIGS = {
    [api_key_1.LlmProvider.NVIDIA_NIM]: {
        name: 'NVIDIA NIM',
        defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
        defaultModel: 'meta/llama-3.1-70b-instruct',
        supportsStreaming: true,
    },
    [api_key_1.LlmProvider.DEEPSEEK]: {
        name: 'DeepSeek',
        defaultBaseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        supportsStreaming: true,
    },
    [api_key_1.LlmProvider.OPENAI]: {
        name: 'OpenAI',
        defaultBaseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o',
        supportsStreaming: true,
    },
    [api_key_1.LlmProvider.CLAUDE]: {
        name: 'Claude',
        defaultBaseUrl: 'https://api.anthropic.com',
        defaultModel: 'claude-sonnet-4-20250514',
        supportsStreaming: true,
    },
    [api_key_1.LlmProvider.CUSTOM]: {
        name: 'Custom',
        defaultBaseUrl: '',
        defaultModel: '',
        supportsStreaming: true,
    },
};
//# sourceMappingURL=providers.js.map