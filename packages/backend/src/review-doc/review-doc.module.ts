import { Module } from '@nestjs/common';
import { ReviewDocService } from './review-doc.service';
import { ReviewDocController } from './review-doc.controller';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { ResumeModule } from '../resume/resume.module';

@Module({
  imports: [AiGatewayModule, ResumeModule],
  controllers: [ReviewDocController],
  providers: [ReviewDocService],
})
export class ReviewDocModule {}
