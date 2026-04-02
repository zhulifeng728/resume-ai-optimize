export enum ResumeStatus {
  UPLOADED = 'UPLOADED',
  PARSING = 'PARSING',
  PARSED = 'PARSED',
  PARSE_FAILED = 'PARSE_FAILED',
}

export enum OptimizationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  originalText: string | null;
  parsedData: Record<string, unknown> | null;
  fileUrl: string | null;
  fileName: string | null;
  status: ResumeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResumeDto {
  title: string;
  originalText?: string;
}

export interface UpdateResumeDto {
  title?: string;
  originalText?: string;
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  content: string;
  diffData: Record<string, unknown> | null;
  versionNumber: number;
  aiModel: string;
  jobId: string | null;
  isSelected: boolean;
  status: OptimizationStatus;
  errorMessage: string | null;
  createdAt: Date;
}
