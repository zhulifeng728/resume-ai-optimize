import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export declare const createResumeSchema: z.ZodObject<{
    title: z.ZodString;
    originalText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    originalText?: string | undefined;
}, {
    title: string;
    originalText?: string | undefined;
}>;
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    sourceUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    company?: string | undefined;
    location?: string | undefined;
    salary?: string | undefined;
    sourceUrl?: string | undefined;
}, {
    title: string;
    description: string;
    company?: string | undefined;
    location?: string | undefined;
    salary?: string | undefined;
    sourceUrl?: string | undefined;
}>;
export declare const createApiKeySchema: z.ZodObject<{
    provider: z.ZodEnum<["NVIDIA_NIM", "DEEPSEEK", "OPENAI", "CLAUDE", "CUSTOM"]>;
    name: z.ZodString;
    apiKey: z.ZodString;
    baseUrl: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    name: string;
    provider: "NVIDIA_NIM" | "DEEPSEEK" | "OPENAI" | "CLAUDE" | "CUSTOM";
    baseUrl?: string | undefined;
    modelId?: string | undefined;
}, {
    apiKey: string;
    name: string;
    provider: "NVIDIA_NIM" | "DEEPSEEK" | "OPENAI" | "CLAUDE" | "CUSTOM";
    baseUrl?: string | undefined;
    modelId?: string | undefined;
}>;
export declare const optimizationRequestSchema: z.ZodObject<{
    resumeId: z.ZodString;
    jobId: z.ZodString;
    apiKeyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resumeId: string;
    jobId: string;
    apiKeyId: string;
}, {
    resumeId: string;
    jobId: string;
    apiKeyId: string;
}>;
export declare const createReviewDocSchema: z.ZodObject<{
    resumeId: z.ZodString;
    resumeVersionId: z.ZodOptional<z.ZodString>;
    apiKeyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resumeId: string;
    apiKeyId: string;
    resumeVersionId?: string | undefined;
}, {
    resumeId: string;
    apiKeyId: string;
    resumeVersionId?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
