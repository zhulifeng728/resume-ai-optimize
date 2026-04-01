import { Module } from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OptimizationController } from './optimization.controller';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { ResumeModule } from '../resume/resume.module';
import { JobModule } from '../job/job.module';

@Module({
  imports: [AiGatewayModule, ResumeModule, JobModule],
  controllers: [OptimizationController],
  providers: [OptimizationService],
})
export class OptimizationModule {}
