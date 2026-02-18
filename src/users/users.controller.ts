import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ok } from '../common/utils/api-response.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Create user directly' })
  @ApiOkResponse({
    description: 'User created',
    example: { id: 'uuid', email: 'user@example.com', role: 'STUDENT' },
  })
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto.email, dto.password, dto.role);
    return ok('User created successfully', data);
  }
}
