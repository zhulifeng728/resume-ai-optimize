export interface ReviewDoc {
    id: string;
    userId: string;
    resumeId: string;
    resumeVersionId: string | null;
    content: string;
    skills: string[];
    aiModel: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateReviewDocDto {
    resumeId: string;
    resumeVersionId?: string;
    apiKeyId: string;
}
