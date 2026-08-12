import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
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

  @Post(':organizationId/members')
  addMember(
    @Param('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(
      organizationId,
      dto.userId,
      dto.role,
    );
  }
}
