import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ReviewDocService } from './review-doc.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createReviewDocSchema, paginationSchema } from '@resume-ai/shared';

@Controller('review-docs')
export class ReviewDocController {
  constructor(private reviewDocService: ReviewDocService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createReviewDocSchema))
    body: { resumeId: string; resumeVersionId?: string; apiKeyId: string },
  ) {
    return this.reviewDocService.generate(userId, body);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; limit: number },
  ) {
    return this.reviewDocService.findAll(userId, query.page, query.limit);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewDocService.findOne(userId, id);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewDocService.delete(userId, id);
  }
}
