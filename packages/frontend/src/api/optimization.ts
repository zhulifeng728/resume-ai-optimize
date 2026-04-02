import client from './client';
import type { OptimizationRequest, OptimizationSubmitResult } from '@resume-ai/shared';

export const optimizationApi = {
  create: (data: OptimizationRequest) =>
    client.post<unknown, { data: OptimizationSubmitResult }>('/optimizations', data),
};
