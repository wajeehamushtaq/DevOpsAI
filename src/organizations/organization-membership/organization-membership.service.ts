import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return membership;
  }

  async hasRole(userId: string, organizationId: string, roles: Role[]) {
    const membership = await this.getMembership(userId, organizationId);

    return roles.includes(membership.role);
  }
}
