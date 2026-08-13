import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService){}

    async register(
        email: string,
        password: string,
        name: string,
        organizationName: string
    ){
        const existingUser = await this.prisma.user.findUnique({
            where: { email }
        })

        if(existingUser){
            throw new ConflictException('User with this email already exists')
        }

        const passwordHash = await bcrypt.hash(password, 12)
        const result = await this.prisma.$transaction(async(tx) => {
            const user = await tx.user.create({
                data: {
                    email, name, passwordHash
                }
            })

            const organization = await tx.organization.create({
                data: { name: organizationName }
            })

            const membership = await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId: user.id,
                    role:Role.ADMIN
                }
            })
            return {
                user, organization, membership
            }
        })

        return {
            user: {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
            },
      
            organization: {
              id: result.organization.id,
              name: result.organization.name,
            },
      
            role: result.membership.role,
          }
    }
}
