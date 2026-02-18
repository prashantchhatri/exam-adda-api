import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutesModule } from './institutes/institutes.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, InstitutesModule, DashboardModule],
})
export class AppModule {}
