import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { ok } from '../common/utils/api-response.util';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super admin records dashboard' })
  async superAdmin() {
    const data = await this.dashboardService.getSuperAdminData();
    return ok('Super admin dashboard fetched', data);
  }

  @Get('institute')
  @Roles(Role.INSTITUTE)
  @ApiOperation({ summary: 'Institute dashboard' })
  async institute(@Req() req: Request) {
    const user = req.user as { userId: string };
    const data = await this.dashboardService.getInstituteData(user.userId);
    return ok('Institute dashboard fetched', data);
  }

  @Get('student')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student dashboard' })
  async student(@Req() req: Request) {
    const user = req.user as { userId: string };
    const data = await this.dashboardService.getStudentData(user.userId);
    return ok('Student dashboard fetched', data);
  }
}
