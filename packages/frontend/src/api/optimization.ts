import client from './client';
import type { OptimizationRequest, OptimizationSubmitResult } from '@resume-ai/shared';

export const optimizationApi = {
  create: (data: OptimizationRequest) =>
    client.post<unknown, { data: OptimizationSubmitResult }>('/optimizations', data),
  previewSections: (resumeId: string) =>
    client.post<unknown, { data: { sections: string[] } }>('/optimizations/preview-sections', { resumeId }),
  cancel: (versionId: string) =>
    client.patch(`/optimizations/versions/${versionId}/cancel`),
};
