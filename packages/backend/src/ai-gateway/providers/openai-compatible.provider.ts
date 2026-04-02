import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { BaseLlmProvider, LlmCompletionOptions, LlmCompletionResult } from './base-llm.provider';

@Injectable()
export class OpenAiCompatibleProvider extends BaseLlmProvider {
  private isOpenRouter(baseUrl?: string): boolean {
    return !!baseUrl?.includes('openrouter.ai');
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };

    if (this.isOpenRouter(options.baseUrl)) {
      body.zdr = false;
      body.provider = { require_parameters: true };
    }

    const response = await client.chat.completions.create(body as any);

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

    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    };

    if (this.isOpenRouter(options.baseUrl)) {
      body.zdr = false;
      body.provider = { require_parameters: true };
    }

    const stream = (await client.chat.completions.create(body as any)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
