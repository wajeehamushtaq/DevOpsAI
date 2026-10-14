import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, EmbeddingsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
