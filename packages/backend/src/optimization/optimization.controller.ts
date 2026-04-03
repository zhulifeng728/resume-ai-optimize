import { Controller, Post, Patch, Body, Param, Sse, MessageEvent } from '@nestjs/common';
import { Observable, from, map, catchError, of } from 'rxjs';
import { OptimizationService } from './optimization.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optimizationRequestSchema } from '@resume-ai/shared';

@Controller('optimizations')
export class OptimizationController {
  constructor(private optimizationService: OptimizationService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(optimizationRequestSchema))
    body: { resumeId: string; jobId: string; apiKeyId: string; splitBySections?: boolean; sections?: string[] },
  ) {
    return this.optimizationService.optimize(userId, body.resumeId, body.jobId, body.apiKeyId, body.splitBySections, body.sections);
  }

  @Post('preview-sections')
  async previewSections(
    @CurrentUser('id') userId: string,
    @Body() body: { resumeId: string },
  ) {
    return this.optimizationService.previewSections(userId, body.resumeId);
  }

  @Patch('versions/:versionId/cancel')
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.optimizationService.cancel(userId, versionId);
  }

  @Sse(':resumeId/:jobId/:apiKeyId/stream')
  stream(
    @CurrentUser('id') userId: string,
    @Param('resumeId') resumeId: string,
    @Param('jobId') jobId: string,
    @Param('apiKeyId') apiKeyId: string,
  ): Observable<MessageEvent> {
    const asyncIterable = this.optimizationService.optimizeStream(userId, resumeId, jobId, apiKeyId);

    async function* toEvents(iterable: AsyncIterable<string>) {
      for await (const chunk of iterable) {
        yield { data: JSON.stringify({ content: chunk }) } as MessageEvent;
      }
      yield { data: JSON.stringify({ done: true }) } as MessageEvent;
    }

    return from(toEvents(asyncIterable)).pipe(
      catchError((err) => of({ data: JSON.stringify({ error: err.message }) } as MessageEvent)),
    );
  }
}
