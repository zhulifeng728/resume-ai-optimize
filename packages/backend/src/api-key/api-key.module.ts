import { Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { EncryptionService } from './encryption.service';

@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService, EncryptionService],
  exports: [ApiKeyService, EncryptionService],
})
export class ApiKeyModule {}
