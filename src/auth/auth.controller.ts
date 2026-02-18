import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterInstituteDto } from './dto/register-institute.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginInstituteDto } from './dto/login-institute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

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
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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
  registerInstitute(@Body() dto: RegisterInstituteDto) {
    return this.authService.registerInstitute(dto);
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
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
  loginForInstitute(@Body() dto: LoginInstituteDto, @Param('slug') slug: string) {
    return this.authService.loginForInstitute(slug, dto);
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
    return this.authService.logout();
  }
}
