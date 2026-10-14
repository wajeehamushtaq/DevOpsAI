import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Role } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ENGINEER)
  @ApiOperation({
    summary: 'Ingest a document',
    description:
      'Chunks and embeds a document for the authenticated user organization. ' +
      'The organization is derived from the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Document successfully stored.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to ingest documents.',
  })
  @ApiResponse({
    status: 404,
    description: 'User does not belong to an organization.',
  })
  @ApiResponse({
    status: 503,
    description: 'Embedding service is unavailable.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(user.id, dto);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Search document chunks',
    description:
      'Returns the top matching chunks in the authenticated user organization.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search text',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching chunks.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'User does not belong to an organization.',
  })
  @ApiResponse({
    status: 503,
    description: 'Embedding service is unavailable.',
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query: string,
  ) {
    return this.documentsService.search(user.id, query ?? '');
  }
}
