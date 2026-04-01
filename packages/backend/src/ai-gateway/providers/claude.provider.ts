import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { BaseLlmProvider, LlmCompletionOptions, LlmCompletionResult } from './base-llm.provider';

@Injectable()
export class ClaudeProvider extends BaseLlmProvider {
  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const client = new Anthropic({ apiKey: options.apiKey }) as any;

    const systemMessage = options.messages.find((m) => m.role === 'system')?.content;
    const messages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      system: systemMessage,
      messages,
    });

    const textBlock = response.content.find((b: any) => b.type === 'text');
    return {
      content: (textBlock as any)?.text || '',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async *completeStream(options: LlmCompletionOptions): AsyncIterable<string> {
    const client = new Anthropic({ apiKey: options.apiKey }) as any;

    const systemMessage = options.messages.find((m) => m.role === 'system')?.content;
    const messages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const stream = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      system: systemMessage,
      messages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && (event.delta as any).type === 'text_delta') {
        yield (event.delta as any).text;
      }
    }
  }
}
