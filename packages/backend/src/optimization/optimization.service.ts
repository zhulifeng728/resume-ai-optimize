import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OptimizationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { ResumeService } from '../resume/resume.service';
import { JobService } from '../job/job.service';
import { buildResumeOptimizePrompt } from '../ai-gateway/prompts/resume-optimize.prompt';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(
    private prisma: PrismaService,
    private aiGateway: AiGatewayService,
    private resumeService: ResumeService,
    private jobService: JobService,
  ) {}

  async optimize(userId: string, resumeId: string, jobId: string, apiKeyId: string, splitBySections = false, sections?: string[]) {
    const resume = await this.resumeService.findOne(userId, resumeId);
    const job = await this.jobService.findOne(userId, jobId);

    if (!resume.originalText) {
      throw new BadRequestException('Resume has no text content. Please parse or enter text first.');
    }

    const lastVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    const version = await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        content: '',
        versionNumber: (lastVersion?.versionNumber || 0) + 1,
        aiModel: 'pending',
        jobId,
        status: OptimizationStatus.PENDING,
      },
    });

    setImmediate(() =>
      this._runOptimization(version.id, userId, apiKeyId, resume.originalText!, job.description, splitBySections, sections)
        .catch((err: any) => this.logger.error('Unhandled optimization error', err))
    );

    return { versionId: version.id, status: OptimizationStatus.PENDING };
  }

  async previewSections(userId: string, resumeId: string) {
    const resume = await this.resumeService.findOne(userId, resumeId);
    if (!resume.originalText) {
      throw new BadRequestException('Resume has no text content.');
    }
    return { sections: this.splitSections(resume.originalText) };
  }

  async cancel(userId: string, versionId: string) {
    const version = await this.prisma.resumeVersion.findFirst({
      where: { id: versionId, resume: { userId } },
    });
    if (!version) throw new BadRequestException('Version not found');
    if (version.status !== OptimizationStatus.PENDING && version.status !== OptimizationStatus.PROCESSING) {
      throw new BadRequestException('Only PENDING or PROCESSING tasks can be cancelled');
    }
    return this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: { status: OptimizationStatus.CANCELLED },
    });
  }

  private splitSections(text: string): string[] {
    const lines = text.split('\n');
    const sections: string[] = [];
    let current: string[] = [];

    for (const line of lines) {
      if (/^#{1,3}\s/.test(line) && current.length > 0) {
        sections.push(current.join('\n').trim());
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) sections.push(current.join('\n').trim());
    return sections.filter(s => s.length > 0);
  }

  private async _runOptimization(
    versionId: string,
    userId: string,
    apiKeyId: string,
    resumeText: string,
    jobDescription: string,
    splitBySections: boolean,
    customSections?: string[],
  ) {
    try {
      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: { status: OptimizationStatus.PROCESSING },
      });

      let optimizedContent: string;

      if (splitBySections) {
        const sections = customSections && customSections.length > 0
          ? customSections
          : this.splitSections(resumeText);
        this.logger.log(`Split into ${sections.length} sections`);
        const optimizedSections: string[] = [];

        for (let i = 0; i < sections.length; i++) {
          this.logger.log(`Optimizing section ${i + 1}/${sections.length}, length=${sections[i].length}`);
          const messages = buildResumeOptimizePrompt(sections[i], jobDescription);
          const result = await this.aiGateway.complete(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 8192 });
          optimizedSections.push(result.content);
        }

        optimizedContent = optimizedSections.join('\n\n');
      } else {
        const messages = buildResumeOptimizePrompt(resumeText, jobDescription);
        this.logger.log(`Input: resume_length=${resumeText.length}, jd_length=${jobDescription.length}`);
        const result = await this.aiGateway.complete(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 16384 });
        this.logger.log(`AI result: content_length=${result.content.length}, usage=${JSON.stringify(result.usage)}`);
        optimizedContent = result.content;
      }

      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: {
          content: optimizedContent,
          aiModel: splitBySections ? 'split-sections' : 'full',
          status: OptimizationStatus.COMPLETED,
        },
      });
    } catch (err: any) {
      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: {
          status: OptimizationStatus.FAILED,
          errorMessage: err?.message || 'Unknown error',
        },
      });
    }
  }

  async *optimizeStream(userId: string, resumeId: string, jobId: string, apiKeyId: string): AsyncIterable<string> {
    const resume = await this.resumeService.findOne(userId, resumeId);
    const job = await this.jobService.findOne(userId, jobId);

    if (!resume.originalText) {
      throw new BadRequestException('Resume has no text content');
    }

    const messages = buildResumeOptimizePrompt(resume.originalText, job.description);

    let fullContent = '';
    for await (const chunk of this.aiGateway.completeStream(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 4096 })) {
      fullContent += chunk;
      yield chunk;
    }

    const lastVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        content: fullContent,
        versionNumber: (lastVersion?.versionNumber || 0) + 1,
        aiModel: 'streamed',
        jobId,
        status: OptimizationStatus.COMPLETED,
      },
    });
  }
}
