import client from './client';
import type { ApiKey, CreateApiKeyDto, UpdateApiKeyDto } from '@resume-ai/shared';

export const apiKeyApi = {
  list: () => client.get<unknown, { data: ApiKey[] }>('/api-keys'),
  create: (data: CreateApiKeyDto) => client.post<unknown, { data: ApiKey }>('/api-keys', data),
  update: (id: string, data: UpdateApiKeyDto) =>
    client.patch<unknown, { data: ApiKey }>(`/api-keys/${id}`, data),
  delete: (id: string) => client.delete(`/api-keys/${id}`),
  test: (id: string) => client.post<unknown, { data: { success: boolean; message: string } }>(`/api-keys/${id}/test`),
  listModels: (body: { provider: string; apiKey: string; baseUrl?: string }) =>
    client.post<unknown, { data: { models: string[] } }>('/api-keys/list-models', body),
  getModelsByKeyId: (id: string) =>
    client.get<unknown, { data: { models: string[] } }>(`/api-keys/${id}/models`),
};
