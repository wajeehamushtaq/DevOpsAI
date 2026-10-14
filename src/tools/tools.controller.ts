import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
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
import { InvokeToolDto } from './dto/invoke-tool.dto';
import { ToolsService } from './tools.service';

interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

@ApiTags('Tools')
@ApiBearerAuth()
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post(':name/invoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ENGINEER, Role.VIEWER)
  @ApiOperation({
    summary: 'Invoke an operational tool',
    description:
      'Runs a named in-process tool for the authenticated user organization. ' +
      'ADMIN and ENGINEER may call every tool. VIEWER may call runbook_search only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tool result.',
  })
  @ApiResponse({
    status: 400,
    description: 'Tool input failed validation.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have permission to call this tool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Tool or organization membership was not found.',
  })
  @ApiResponse({
    status: 408,
    description: 'Tool timed out.',
  })
  invoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('name') name: string,
    @Body() dto: InvokeToolDto,
  ) {
    return this.toolsService.invoke(user.id, name, dto.input);
  }
}
