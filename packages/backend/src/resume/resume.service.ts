import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeStatus } from '@prisma/client';

@Injectable()
export class ResumeService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { title: string; originalText?: string }) {
    return this.prisma.resume.create({
      data: {
        userId,
        title: data.title,
        originalText: data.originalText || null,
        status: data.originalText ? ResumeStatus.PARSED : ResumeStatus.UPLOADED,
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resume.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  async update(userId: string, id: string, data: { title?: string; originalText?: string }) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    return this.prisma.resume.update({
      where: { id },
      data,
    });
  }

  async delete(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    await this.prisma.resume.delete({ where: { id } });
    return { message: 'Resume deleted' };
  }

  async createWithFile(userId: string, title: string, fileName: string, fileUrl: string) {
    return this.prisma.resume.create({
      data: {
        userId,
        title,
        fileName,
        fileUrl,
        status: ResumeStatus.UPLOADED,
      },
    });
  }

  async updateParsedContent(id: string, originalText: string, parsedData: Record<string, unknown>) {
    return this.prisma.resume.update({
      where: { id },
      data: {
        originalText,
        parsedData: parsedData as any,
        status: ResumeStatus.PARSED,
      },
    });
  }

  async updateStatus(id: string, status: ResumeStatus) {
    return this.prisma.resume.update({
      where: { id },
      data: { status },
    });
  }

  async getVersions(userId: string, resumeId: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    return this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async selectVersion(userId: string, resumeId: string, versionId: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    // Deselect all versions
    await this.prisma.resumeVersion.updateMany({
      where: { resumeId },
      data: { isSelected: false },
    });

    // Select the target version
    return this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: { isSelected: true },
    });
  }
}
