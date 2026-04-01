export enum JobSource {
  MANUAL = 'MANUAL',
  CRAWLED = 'CRAWLED',
}

export interface Job {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  description: string;
  parsedSkills: string[] | null;
  source: JobSource;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobDto {
  title: string;
  company?: string;
  location?: string;
  salary?: string;
  description: string;
  sourceUrl?: string;
}

export interface UpdateJobDto {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  description?: string;
}
