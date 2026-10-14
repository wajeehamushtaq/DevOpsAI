import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WorkflowsService } from './workflows.service';

interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('incidents')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post(':id/workflows/ticket')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Request a ticket workflow',
    description:
      'Dispatches the approved ticket workflow for an incident in the ' +
      'authenticated user organization. Tickets are not created automatically.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket workflow dispatch was recorded.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to request a ticket.',
  })
  @ApiResponse({
    status: 404,
    description: 'User or incident was not found in the organization.',
  })
  requestTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.workflowsService.requestTicket(user.id, id);
  }
}
