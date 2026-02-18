import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InstitutesService } from './institutes.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDetailsDto } from './dto/update-institute-details.dto';

@ApiTags('Institutes')
@Controller('institutes')
export class InstitutesController {
  constructor(private readonly institutesService: InstitutesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTITUTE, Role.SUPER_ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Create institute' })
  @ApiOkResponse({
    description: 'Institute created',
    example: {
      id: 'uuid',
      name: 'Exam Adda Academy',
      description: 'Focused test prep',
      ownerId: 'uuid',
    },
  })
  create(@Body() dto: CreateInstituteDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: Role };
    return this.institutesService.create(user.userId, user.role, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Get institute owned by current user' })
  me(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.institutesService.findMine(user.userId);
  }

  @Patch('me/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTITUTE)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Add or update institute login details (logo, address, phone)' })
  updateDetails(@Req() req: Request, @Body() dto: UpdateInstituteDetailsDto) {
    const user = req.user as { userId: string };
    return this.institutesService.updateMineDetails(user.userId, dto);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Fetch public institute login details by slug' })
  bySlug(@Param('slug') slug: string) {
    return this.institutesService.findPublicBySlug(slug);
  }

  @Get()
  @ApiOperation({ summary: 'List public institute options' })
  listPublic() {
    return this.institutesService.findAllPublic();
  }
}
