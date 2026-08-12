import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// This means we can inject: PrismaService into our modules without importing PrismaModule everywhere.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
