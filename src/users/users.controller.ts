import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

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
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto.email, dto.password, dto.role);
  }
}
