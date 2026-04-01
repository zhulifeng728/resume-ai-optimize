import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createApiKeySchema } from '@resume-ai/shared';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createApiKeySchema)) body: { provider: any; name: string; apiKey: string; baseUrl?: string; modelId?: string },
  ) {
    return this.apiKeyService.create(userId, body);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.apiKeyService.findAll(userId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; baseUrl?: string; modelId?: string; isDefault?: boolean },
  ) {
    return this.apiKeyService.update(userId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.apiKeyService.delete(userId, id);
  }

  @Post(':id/test')
  async test(@CurrentUser('id') userId: string, @Param('id') id: string) {
    try {
      const key = await this.apiKeyService.getDecryptedKey(userId, id);
      const apiKeyRecord = await this.apiKeyService.findOne(userId, id);
      if (key && key.length > 0) {
        return { success: true, message: `Key for ${apiKeyRecord.provider} is valid (${key.length} characters)` };
      }
      return { success: false, message: 'Key appears to be empty' };
    } catch {
      return { success: false, message: 'Failed to decrypt key' };
    }
  }

  // 用临时传入的 key 获取模型列表（添加 Key 时使用）
  @Post('list-models')
  async listModels(
    @Body() body: { provider: string; apiKey: string; baseUrl?: string },
  ) {
    const models = await this.apiKeyService.listModels(body.provider, body.apiKey, body.baseUrl);
    return { models };
  }

  // 用已保存的 key 获取模型列表（编辑时使用）
  @Get(':id/models')
  async getModelsByKey(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const models = await this.apiKeyService.listModelsByKeyId(userId, id);
    return { models };
  }
}
