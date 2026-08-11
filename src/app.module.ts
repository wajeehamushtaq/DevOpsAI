import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [HealthModule, OrganizationsModule, UsersModule, IncidentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
