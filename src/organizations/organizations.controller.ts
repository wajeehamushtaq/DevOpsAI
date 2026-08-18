import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Role } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';

import { OrganizationRolesGuard } from '../auth/organization-roles.guard';

import { UseGuards } from '@nestjs/common';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto.name);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Roles(Role.ADMIN)
  @UseGuards(OrganizationRolesGuard)
  @Post(':organizationId/members')
  addMember(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(
      organizationId,
      dto.userId,
      dto.role,
    );
  }
}
