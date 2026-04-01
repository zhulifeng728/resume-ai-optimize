import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { ResumeService } from '../resume/resume.service';
import { JobService } from '../job/job.service';
import { buildResumeOptimizePrompt } from '../ai-gateway/prompts/resume-optimize.prompt';

@Injectable()
export class OptimizationService {
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

    const messages = buildResumeOptimizePrompt(resume.originalText, job.description);
    const result = await this.aiGateway.complete(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 4096 });

    let parsed: any;
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { optimizedResume: result.content, sections: [], matchScore: 0, suggestions: [] };
    } catch {
      parsed = { optimizedResume: result.content, sections: [], matchScore: 0, suggestions: [] };
    }

    // Get next version number
    const lastVersion = await this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });

    const version = await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        content: parsed.optimizedResume || result.content,
        diffData: { sections: parsed.sections, matchScore: parsed.matchScore, suggestions: parsed.suggestions },
        versionNumber: (lastVersion?.versionNumber || 0) + 1,
        aiModel: result.model,
        jobId,
      },
    });

    return {
      id: version.id,
      resumeVersionId: version.id,
      status: 'completed',
      version,
    };
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
      },
    });
  }
}
