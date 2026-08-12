import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

export interface Organization {
  id: string;
  name: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string) {
    try {
      return await this.prisma.organization.create({
        data: {
          name,
        },
      });
    } catch (error) {
      console.error('CREATE ORGANIZATION ERROR:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addMember(organizationId: string, userId: string, role: Role) {
    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
    });
  }
}
