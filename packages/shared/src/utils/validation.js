"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.createReviewDocSchema = exports.optimizationRequestSchema = exports.createApiKeySchema = exports.createJobSchema = exports.createResumeSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(1, 'Name is required').max(100),
});
exports.createResumeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    originalText: zod_1.z.string().optional(),
});
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Job title is required').max(200),
    company: zod_1.z.string().max(200).optional(),
    location: zod_1.z.string().max(200).optional(),
    salary: zod_1.z.string().max(100).optional(),
    description: zod_1.z.string().min(1, 'Job description is required'),
    sourceUrl: zod_1.z.string().url().optional(),
});
exports.createApiKeySchema = zod_1.z.object({
    provider: zod_1.z.enum(['NVIDIA_NIM', 'DEEPSEEK', 'OPENAI', 'CLAUDE', 'CUSTOM']),
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    apiKey: zod_1.z.string().min(1, 'API key is required'),
    baseUrl: zod_1.z.string().url().optional(),
    modelId: zod_1.z.string().optional(),
});
exports.optimizationRequestSchema = zod_1.z.object({
    resumeId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid(),
    apiKeyId: zod_1.z.string().uuid(),
});
exports.createReviewDocSchema = zod_1.z.object({
    resumeId: zod_1.z.string().uuid(),
    resumeVersionId: zod_1.z.string().uuid().optional(),
    apiKeyId: zod_1.z.string().uuid(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=validation.js.map