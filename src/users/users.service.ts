import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeUser(user: {
    id: string,
    email: string,
    name: string | null,
    passwordHash: string
  }){
    const {passwordHash, ...safeUser} = user
    return safeUser
  }

  async create(email: string, name: string | undefined, password: string) {
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash
      },
    });

    return this.sanitizeUser(user)
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        memberships: true,
      },
    });
  }
}
