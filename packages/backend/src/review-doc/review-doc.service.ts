import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { ResumeService } from '../resume/resume.service';
import { buildReviewDocPrompt } from '../ai-gateway/prompts/review-doc.prompt';

@Injectable()
export class ReviewDocService {
  constructor(
    private prisma: PrismaService,
    private aiGateway: AiGatewayService,
    private resumeService: ResumeService,
  ) {}

  async generate(userId: string, data: { resumeId: string; resumeVersionId?: string; apiKeyId: string }) {
    const resume = await this.resumeService.findOne(userId, data.resumeId);

    let resumeText: string;

    if (data.resumeVersionId) {
      const version = await this.prisma.resumeVersion.findFirst({
        where: { id: data.resumeVersionId, resumeId: data.resumeId },
      });
      if (!version) throw new NotFoundException('Resume version not found');
      resumeText = version.content;
    } else {
      // Use selected version or original text
      const selectedVersion = await this.prisma.resumeVersion.findFirst({
        where: { resumeId: data.resumeId, isSelected: true },
      });
      resumeText = selectedVersion?.content || resume.originalText || '';
    }

    if (!resumeText) {
      throw new BadRequestException('No resume content available');
    }

    const messages = buildReviewDocPrompt(resumeText);
    const result = await this.aiGateway.complete(userId, data.apiKeyId, messages, { temperature: 0.7, maxTokens: 8192 });

    // Extract skills from the generated content
    const skills = this.extractSkills(result.content);

    return this.prisma.reviewDoc.create({
      data: {
        userId,
        resumeId: data.resumeId,
        resumeVersionId: data.resumeVersionId || null,
        content: result.content,
        skills,
        aiModel: result.model,
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.reviewDoc.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { resume: { select: { title: true } } },
      }),
      this.prisma.reviewDoc.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(userId: string, id: string) {
    const doc = await this.prisma.reviewDoc.findFirst({
      where: { id, userId },
      include: { resume: { select: { title: true } } },
    });
    if (!doc) throw new NotFoundException('Review document not found');
    return doc;
  }

  async delete(userId: string, id: string) {
    const doc = await this.prisma.reviewDoc.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Review document not found');
    await this.prisma.reviewDoc.delete({ where: { id } });
    return { message: 'Review document deleted' };
  }

  private extractSkills(content: string): string[] {
    const skills: Set<string> = new Set();
    // Simple extraction from markdown headers and content
    const techPatterns = /(?:React|Vue|Angular|Node\.js|TypeScript|JavaScript|Python|Java|Go|Rust|Docker|Kubernetes|AWS|GCP|Azure|PostgreSQL|MongoDB|Redis|GraphQL|REST|CI\/CD|Git|Linux|SQL|NoSQL|Microservices|System Design)/gi;
    const matches = content.match(techPatterns);
    if (matches) {
      matches.forEach((m) => skills.add(m));
    }
    return Array.from(skills);
  }
}
