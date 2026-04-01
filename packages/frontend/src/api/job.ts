import client from './client';
import type { Job, CreateJobDto, UpdateJobDto, PaginatedResponse } from '@resume-ai/shared';

export const jobApi = {
  list: (params?: { page?: number; limit?: number }) =>
    client.get<unknown, { data: PaginatedResponse<Job> }>('/jobs', { params }),
  get: (id: string) => client.get<unknown, { data: Job }>(`/jobs/${id}`),
  create: (data: CreateJobDto) => client.post<unknown, { data: Job }>('/jobs', data),
  update: (id: string, data: UpdateJobDto) => client.patch<unknown, { data: Job }>(`/jobs/${id}`, data),
  delete: (id: string) => client.delete(`/jobs/${id}`),
};
