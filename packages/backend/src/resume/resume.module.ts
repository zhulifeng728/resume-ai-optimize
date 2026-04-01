import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { ParserService } from './parser/parser.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ParserService],
  exports: [ResumeService],
})
export class ResumeModule {}
