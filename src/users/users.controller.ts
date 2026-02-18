import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ok } from '../common/utils/api-response.util';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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
