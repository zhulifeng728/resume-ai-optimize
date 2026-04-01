import { Injectable, BadRequestException } from '@nestjs/common';
import { ApiKeyService } from '../api-key/api-key.service';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { LlmCompletionOptions, LlmCompletionResult } from './providers/base-llm.provider';
import { PROVIDER_CONFIGS } from '@resume-ai/shared';
import { LlmProvider } from '@prisma/client';

@Injectable()
export class AiGatewayService {
  constructor(
    private apiKeyService: ApiKeyService,
    private openAiProvider: OpenAiCompatibleProvider,
    private claudeProvider: ClaudeProvider,
  ) {}

  async complete(
    userId: string,
    apiKeyId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    opts?: { temperature?: number; maxTokens?: number },
  ): Promise<LlmCompletionResult> {
    const { provider, options } = await this.buildOptions(userId, apiKeyId, messages, opts);
    return provider.complete(options);
  }

  async *completeStream(
    userId: string,
    apiKeyId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    opts?: { temperature?: number; maxTokens?: number },
  ): AsyncIterable<string> {
    const { provider, options } = await this.buildOptions(userId, apiKeyId, messages, opts);
    yield* provider.completeStream(options);
  }

  private async buildOptions(
    userId: string,
    apiKeyId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    opts?: { temperature?: number; maxTokens?: number },
  ): Promise<{ provider: OpenAiCompatibleProvider | ClaudeProvider; options: LlmCompletionOptions }> {
    const apiKeyRecord = await this.apiKeyService.findOne(userId, apiKeyId);
    const decryptedKey = await this.apiKeyService.getDecryptedKey(userId, apiKeyId);

    const providerConfig = PROVIDER_CONFIGS[apiKeyRecord.provider as keyof typeof PROVIDER_CONFIGS];
    if (!providerConfig) {
      throw new BadRequestException(`Unsupported provider: ${apiKeyRecord.provider}`);
    }

    const options: LlmCompletionOptions = {
      apiKey: decryptedKey,
      baseUrl: apiKeyRecord.baseUrl || providerConfig.defaultBaseUrl,
      model: apiKeyRecord.modelId || providerConfig.defaultModel,
      messages,
      temperature: opts?.temperature,
      maxTokens: opts?.maxTokens,
    };

    const provider = apiKeyRecord.provider === LlmProvider.CLAUDE
      ? this.claudeProvider
      : this.openAiProvider;

    return { provider, options };
  }
}
