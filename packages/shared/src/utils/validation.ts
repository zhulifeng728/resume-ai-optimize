import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const createResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  originalText: z.string().optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  company: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  salary: z.string().max(100).optional(),
  description: z.string().min(1, 'Job description is required'),
  sourceUrl: z.string().url().optional(),
});

export const createApiKeySchema = z.object({
  provider: z.enum(['NVIDIA_NIM', 'DEEPSEEK', 'OPENAI', 'CLAUDE', 'CUSTOM']),
  name: z.string().min(1, 'Name is required').max(100),
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional(),
  modelId: z.string().optional(),
});

export const optimizationRequestSchema = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid(),
  apiKeyId: z.string().uuid(),
  splitBySections: z.boolean().optional(),
  sections: z.array(z.string()).optional(),
});

export const createReviewDocSchema = z.object({
  resumeId: z.string().uuid(),
  resumeVersionId: z.string().uuid().optional(),
  apiKeyId: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
