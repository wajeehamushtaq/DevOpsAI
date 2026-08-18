import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateIncidentDto,
  ) {
    /*
     * Find the organization membership of the authenticated user.
     *
     * We NEVER accept organizationId from the client.
     */
    const membership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId,
        },
        select: {
          id: true,
          organizationId: true,
          role: true,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'User does not belong to any organization.',
      );
    }

    /*
     * Create the incident using trusted server-side values.
     */
    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,

        severity: dto.severity,
        priority: dto.priority,

        organizationId: membership.organizationId,
        createdById: userId,
      },

      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return incident;
  }
}