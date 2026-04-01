import client from './client';
import type { OptimizationRequest, OptimizationResult } from '@resume-ai/shared';

export const optimizationApi = {
  create: (data: OptimizationRequest) =>
    client.post<unknown, { data: OptimizationResult }>('/optimizations', data),
  get: (id: string) =>
    client.get<unknown, { data: OptimizationResult }>(`/optimizations/${id}`),
  streamUrl: (id: string) => `/api/optimizations/${id}/stream`,
};
