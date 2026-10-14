import { Module } from '@nestjs/common';

import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, DocumentsModule, ToolsModule, WorkflowsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}