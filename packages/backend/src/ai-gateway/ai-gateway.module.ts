import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { ApiKeyModule } from '../api-key/api-key.module';

@Module({
  imports: [ApiKeyModule],
  providers: [AiGatewayService, OpenAiCompatibleProvider, ClaudeProvider],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
