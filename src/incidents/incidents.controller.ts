import {
  Body,
  Controller,
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
}