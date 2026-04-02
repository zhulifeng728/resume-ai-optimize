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

  async optimize(userId: string, resumeId: string, jobId: string, apiKeyId: string) {
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
      this._runOptimization(version.id, userId, apiKeyId, resume.originalText!, job.description)
        .catch(err => this.logger.error('Unhandled optimization error', err))
    );

    return { versionId: version.id, status: OptimizationStatus.PENDING };
  }

  private async _runOptimization(
    versionId: string,
    userId: string,
    apiKeyId: string,
    resumeText: string,
    jobDescription: string,
  ) {
    try {
      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: { status: OptimizationStatus.PROCESSING },
      });

      const messages = buildResumeOptimizePrompt(resumeText, jobDescription);
      const result = await this.aiGateway.complete(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 4096 });

      let parsed: any;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { optimizedResume: result.content };
      } catch {
        parsed = { optimizedResume: result.content };
      }

      await this.prisma.resumeVersion.update({
        where: { id: versionId },
        data: {
          content: parsed.optimizedResume || result.content,
          diffData: { sections: parsed.sections, matchScore: parsed.matchScore, suggestions: parsed.suggestions },
          aiModel: result.model,
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

    // Save the completed version
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
