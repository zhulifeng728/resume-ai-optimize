import client from './client';
import type { Resume, ResumeVersion, PaginatedResponse } from '@resume-ai/shared';

export const resumeApi = {
  list: (params?: { page?: number; limit?: number }) =>
    client.get<unknown, { data: PaginatedResponse<Resume> }>('/resumes', { params }),
  get: (id: string) => client.get<unknown, { data: Resume }>(`/resumes/${id}`),
  upload: (formData: FormData) =>
    client.post<unknown, { data: Resume }>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  create: (data: { title: string; originalText: string }) =>
    client.post<unknown, { data: Resume }>('/resumes', data),
  update: (id: string, data: { title?: string; originalText?: string }) =>
    client.patch<unknown, { data: Resume }>(`/resumes/${id}`, data),
  delete: (id: string) => client.delete(`/resumes/${id}`),
  getVersions: (resumeId: string) =>
    client.get<unknown, { data: ResumeVersion[] }>(`/resumes/${resumeId}/versions`),
  selectVersion: (resumeId: string, versionId: string) =>
    client.patch(`/resumes/${resumeId}/versions/${versionId}/select`),
};
