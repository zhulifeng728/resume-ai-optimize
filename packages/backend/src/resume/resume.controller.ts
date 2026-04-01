import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { ParserService } from './parser/parser.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createResumeSchema, paginationSchema } from '@resume-ai/shared';
import { ResumeStatus } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('resumes')
export class ResumeController {
  constructor(
    private resumeService: ResumeService,
    private parserService: ParserService,
  ) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createResumeSchema)) body: { title: string; originalText?: string },
  ) {
    return this.resumeService.create(userId, body);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file format'), false);
        }
      },
    }),
  )
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const resume = await this.resumeService.createWithFile(
      userId,
      title || file.originalname,
      file.originalname,
      file.path,
    );

    // Parse file asynchronously
    this.parseFile(resume.id, file).catch(console.error);

    return resume;
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; limit: number },
  ) {
    return this.resumeService.findAll(userId, query.page, query.limit);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumeService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; originalText?: string },
  ) {
    return this.resumeService.update(userId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumeService.delete(userId, id);
  }

  @Get(':id/versions')
  async getVersions(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumeService.getVersions(userId, id);
  }

  @Patch(':resumeId/versions/:versionId/select')
  async selectVersion(
    @CurrentUser('id') userId: string,
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.resumeService.selectVersion(userId, resumeId, versionId);
  }

  private async parseFile(resumeId: string, file: Express.Multer.File) {
    try {
      await this.resumeService.updateStatus(resumeId, ResumeStatus.PARSING);
      const result = await this.parserService.parse(file);
      await this.resumeService.updateParsedContent(resumeId, result.text, result.metadata);
    } catch (error) {
      console.error('Parse error:', error);
      await this.resumeService.updateStatus(resumeId, ResumeStatus.PARSE_FAILED);
    }
  }
}
