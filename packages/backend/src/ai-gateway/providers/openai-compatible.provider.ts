import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { BaseLlmProvider, LlmCompletionOptions, LlmCompletionResult } from './base-llm.provider';

@Injectable()
export class OpenAiCompatibleProvider extends BaseLlmProvider {
  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    const isOpenRouter = options.baseUrl?.includes('openrouter.ai');

    const response = await client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      ...(isOpenRouter && {
        zdr: false,
        provider_requirements: { does_train_prompts: true },
      } as any),
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *completeStream(options: LlmCompletionOptions): AsyncIterable<string> {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    const isOpenRouter = options.baseUrl?.includes('openrouter.ai');

    const stream = await client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
      ...(isOpenRouter && {
        zdr: false,
        provider_requirements: { does_train_prompts: true },
      } as any),
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
