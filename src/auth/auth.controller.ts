import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterInstituteDto } from './dto/register-institute.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginInstituteDto } from './dto/login-institute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ok } from '../common/utils/api-response.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Generic registration endpoint' })
  @ApiOkResponse({
    description: 'Successful registration',
    example: {
      accessToken: 'jwt-token',
      user: { id: 'uuid', email: 'student@example.com', role: 'STUDENT' },
    },
  })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return ok('Registration successful', data);
  }

  @Post('register/institute')
  @ApiOperation({ summary: 'Register institute owner and institute profile' })
  @ApiOkResponse({
    description: 'Institute registration success',
    example: {
      accessToken: 'jwt-token',
      user: { id: 'uuid', email: 'owner@example.com', role: 'INSTITUTE' },
    },
  })
  async registerInstitute(@Body() dto: RegisterInstituteDto) {
    const data = await this.authService.registerInstitute(dto);
    return ok('Institute registration successful', data);
  }

  @Post('register/student')
  @ApiOperation({ summary: 'Register student under an institute' })
  @ApiOkResponse({
    description: 'Student registration success',
    example: {
      accessToken: 'jwt-token',
      user: { id: 'uuid', email: 'student@example.com', role: 'STUDENT' },
    },
  })
  async registerStudent(@Body() dto: RegisterStudentDto) {
    const data = await this.authService.registerStudent(dto);
    return ok('Student registration successful', data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Login success',
    example: {
      accessToken: 'jwt-token',
      user: { id: 'uuid', email: 'pkumarchhatri@gmail.com', role: 'SUPER_ADMIN' },
    },
  })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return ok('Login successful', data);
  }

  @Post('login/institute/:slug')
  @ApiOperation({ summary: 'Institute portal login (institute owner or student of that institute)' })
  @ApiOkResponse({
    description: 'Institute portal login success',
    example: {
      accessToken: 'jwt-token',
      user: { id: 'uuid', email: 'student@example.com', role: 'STUDENT' },
    },
  })
  async loginForInstitute(@Body() dto: LoginInstituteDto, @Param('slug') slug: string) {
    const data = await this.authService.loginForInstitute(slug, dto);
    return ok('Institute login successful', data);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Logout current user (client should clear token)' })
  @ApiOkResponse({
    description: 'Logout success',
    example: { message: 'Logged out successfully' },
  })
  logout() {
    this.authService.logout();
    return ok('Logged out successfully', null);
  }
}
