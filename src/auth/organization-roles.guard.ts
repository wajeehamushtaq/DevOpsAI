import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Role } from '@prisma/client';

import { ROLES_KEY } from './roles.decorator';

import { OrganizationMembershipService } from '../organizations/organization-membership/organization-membership.service';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipService: OrganizationMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    const organizationId = request.params.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    const allowed = await this.membershipService.hasRole(
      user.userId,
      organizationId,
      requiredRoles,
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
