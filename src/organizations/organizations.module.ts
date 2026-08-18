import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationMembershipService } from './organization-membership/organization-membership.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationMembershipService],
})
export class OrganizationsModule {}
