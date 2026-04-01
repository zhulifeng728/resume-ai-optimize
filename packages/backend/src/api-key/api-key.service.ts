import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { LlmProvider } from '@prisma/client';
import OpenAI from 'openai';
import { PROVIDER_CONFIGS } from '@resume-ai/shared';

@Injectable()
export class ApiKeyService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(userId: string, data: { provider: LlmProvider; name: string; apiKey: string; baseUrl?: string; modelId?: string }) {
    const { encrypted, iv, tag } = this.encryptionService.encrypt(data.apiKey);

    return this.prisma.apiKey.create({
      data: {
        userId,
        provider: data.provider,
        name: data.name,
        encryptedKey: encrypted,
        keyIv: iv,
        keyTag: tag,
        baseUrl: data.baseUrl || null,
        modelId: data.modelId || null,
      },
      select: {
        id: true,
        userId: true,
        provider: true,
        name: true,
        baseUrl: true,
        modelId: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key) => ({
      id: key.id,
      userId: key.userId,
      provider: key.provider,
      name: key.name,
      maskedKey: this.maskKey(this.encryptionService.decrypt(key.encryptedKey, key.keyIv, key.keyTag)),
      baseUrl: key.baseUrl,
      modelId: key.modelId,
      isDefault: key.isDefault,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  }

  async findOne(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    return key;
  }

  async getDecryptedKey(userId: string, id: string): Promise<string> {
    const key = await this.findOne(userId, id);
    return this.encryptionService.decrypt(key.encryptedKey, key.keyIv, key.keyTag);
  }

  async update(userId: string, id: string, data: { name?: string; baseUrl?: string; modelId?: string; isDefault?: boolean }) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');

    if (data.isDefault) {
      await this.prisma.apiKey.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.apiKey.update({
      where: { id },
      data,
      select: {
        id: true,
        userId: true,
        provider: true,
        name: true,
        baseUrl: true,
        modelId: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API key deleted' };
  }

  async listModels(provider: string, apiKey: string, baseUrl?: string): Promise<string[]> {
    const config = PROVIDER_CONFIGS[provider as LlmProvider];
    const effectiveBaseUrl = baseUrl || config?.defaultBaseUrl;

    if (provider === LlmProvider.CLAUDE) {
      return [
        'claude-opus-4-6',
        'claude-sonnet-4-6',
        'claude-haiku-4-5-20251001',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
      ];
    }

    try {
      const client = new OpenAI({ apiKey, baseURL: effectiveBaseUrl });
      const response = await client.models.list();
      return response.data.map((m) => m.id).sort();
    } catch (err: any) {
      const detail = err?.message || '未知错误';
      throw new BadRequestException(`无法获取模型列表：${detail}`);
    }
  }

  async listModelsByKeyId(userId: string, keyId: string): Promise<string[]> {
    const key = await this.findOne(userId, keyId);
    const decryptedKey = this.encryptionService.decrypt(key.encryptedKey, key.keyIv, key.keyTag);
    return this.listModels(key.provider, decryptedKey, key.baseUrl || undefined);
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }
}
