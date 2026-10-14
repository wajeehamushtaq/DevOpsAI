import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { IncidentsService } from './incidents.service';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

import { Role } from '@prisma/client';

interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ENGINEER)
  @ApiOperation({
    summary: 'Create a new incident',
    description:
      'Creates an incident for the authenticated user organization. ' +
      'The organization and creator are derived from the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Incident successfully created.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to create incidents.',
  })
  @ApiResponse({
    status: 404,
    description: 'User does not belong to an organization.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.incidentsService.create(user.id, dto);
  }

  @Get(':id/context')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve document context for an incident',
    description:
      'Embeds the incident title and description and returns the top matching ' +
      'chunks in the authenticated user organization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching document chunks.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'User or incident was not found in the organization.',
  })
  @ApiResponse({
    status: 503,
    description: 'Embedding service is unavailable.',
  })
  context(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.incidentsService.context(user.id, id);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Assign an incident',
    description:
      'Assigns an incident to a member of the authenticated user organization. ' +
      'The organization is derived from the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Incident successfully assigned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Assignee is not a member of the organization.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to assign incidents.',
  })
  @ApiResponse({
    status: 404,
    description: 'User or incident was not found in the organization.',
  })
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignIncidentDto,
  ) {
    return this.incidentsService.assign(
      user.id,
      id,
      dto.assignedToId,
    );
  }

  @Post(':id/investigate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ENGINEER)
  @ApiOperation({
    summary: 'Investigate an incident',
    description:
      'Runs a fixed runbook, log, and deployment sequence for an incident ' +
      'in the authenticated user organization and stores an AgentRun.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investigation AgentRun, including a FAILED run.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to investigate incidents.',
  })
  @ApiResponse({
    status: 404,
    description: 'User or incident was not found in the organization.',
  })
  investigate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.incidentsService.investigate(user.id, id);
  }
}