import client from './client';
import type { ReviewDoc, CreateReviewDocDto, PaginatedResponse } from '@resume-ai/shared';

export const reviewDocApi = {
  list: (params?: { page?: number; limit?: number }) =>
    client.get<unknown, { data: PaginatedResponse<ReviewDoc> }>('/review-docs', { params }),
  get: (id: string) => client.get<unknown, { data: ReviewDoc }>(`/review-docs/${id}`),
  create: (data: CreateReviewDocDto) =>
    client.post<unknown, { data: ReviewDoc }>('/review-docs', data),
  delete: (id: string) => client.delete(`/review-docs/${id}`),
};
