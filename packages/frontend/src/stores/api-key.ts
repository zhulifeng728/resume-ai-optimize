import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiKeyApi } from '@/api/api-key';
import type { ApiKey, CreateApiKeyDto, UpdateApiKeyDto } from '@resume-ai/shared';

export const useApiKeyStore = defineStore('api-key', () => {
  const apiKeys = ref<ApiKey[]>([]);
  const loading = ref(false);

  async function fetchApiKeys() {
    loading.value = true;
    try {
      const res = await apiKeyApi.list();
      apiKeys.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  async function createApiKey(data: CreateApiKeyDto) {
    const res = await apiKeyApi.create(data);
    apiKeys.value.push(res.data);
    return res.data;
  }

  async function updateApiKey(id: string, data: UpdateApiKeyDto) {
    const res = await apiKeyApi.update(id, data);
    const index = apiKeys.value.findIndex((k) => k.id === id);
    if (index !== -1) apiKeys.value[index] = res.data;
    return res.data;
  }

  async function deleteApiKey(id: string) {
    await apiKeyApi.delete(id);
    apiKeys.value = apiKeys.value.filter((k) => k.id !== id);
  }

  async function testApiKey(id: string) {
    return apiKeyApi.test(id);
  }

  return { apiKeys, loading, fetchApiKeys, createApiKey, updateApiKey, deleteApiKey, testApiKey };
});
