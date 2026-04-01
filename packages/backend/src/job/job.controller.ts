import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createJobSchema, paginationSchema } from '@resume-ai/shared';

@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createJobSchema)) body: { title: string; company?: string; location?: string; salary?: string; description: string; sourceUrl?: string },
  ) {
    return this.jobService.create(userId, body);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; limit: number },
  ) {
    return this.jobService.findAll(userId, query.page, query.limit);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; company?: string; location?: string; salary?: string; description?: string },
  ) {
    return this.jobService.update(userId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobService.delete(userId, id);
  }
}
