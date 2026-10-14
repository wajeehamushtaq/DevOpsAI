import { Module } from '@nestjs/common';

import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolRegistry } from './tool-registry';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [ToolsController],
  providers: [ToolsService, ToolRegistry],
  exports: [ToolsService],
})
export class ToolsModule {}
