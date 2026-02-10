import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { InstitutesModule } from './institutes/institutes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, InstitutesModule],
  controllers: [HealthController],
})
export class AppModule {}
