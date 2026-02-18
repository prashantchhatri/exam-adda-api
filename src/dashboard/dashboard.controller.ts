import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super admin records dashboard' })
  superAdmin() {
    return this.dashboardService.getSuperAdminData();
  }

  @Get('institute')
  @Roles(Role.INSTITUTE)
  @ApiOperation({ summary: 'Institute dashboard' })
  institute(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.dashboardService.getInstituteData(user.userId);
  }

  @Get('student')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student dashboard' })
  student(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.dashboardService.getStudentData(user.userId);
  }
}
