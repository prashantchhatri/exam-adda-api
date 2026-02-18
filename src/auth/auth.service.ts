import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInstituteDto } from './dto/register-institute.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginInstituteDto } from './dto/login-institute.dto';

type AuthUser = {
  id: string;
  email: string;
  role: Role;
  password: string;
};

type InstituteScopeRecord = {
  institute_id: string;
  institute_name: string;
  institute_slug: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('SUPER_ADMIN cannot be self-registered');
    }
    const user = await this.usersService.create(dto.email, dto.password, dto.role ?? Role.STUDENT);
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async registerInstitute(dto: RegisterInstituteDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const userId = randomUUID();
    const instituteId = randomUUID();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.transaction(async (client) => {
      await client.query(
        `
        INSERT INTO users (id, email, password, role, full_name, phone)
        VALUES ($1::uuid, $2, $3, $4, $5, $6)
      `,
        [userId, dto.email, passwordHash, Role.INSTITUTE, dto.ownerName, dto.phone],
      );

      await client.query(
        `
        INSERT INTO institutes (id, name, slug, description, owner_id)
        VALUES ($1::uuid, $2, $3, $4, $5::uuid)
      `,
        [instituteId, dto.instituteName, this.normalizeInstituteSlug(dto.instituteName), dto.description || null, userId],
      );
    });

    return this.buildAuthResponse(userId, dto.email, Role.INSTITUTE);
  }

  async registerStudent(dto: RegisterStudentDto) {
    const user = await this.usersService.createStudent(
      dto.email,
      dto.password,
      dto.fullName,
      dto.phone,
      dto.instituteId,
    );
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = (await this.usersService.findByEmail(dto.email)) as AuthUser | null;
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async loginForInstitute(instituteSlug: string, dto: LoginInstituteDto) {
    const user = (await this.usersService.findByEmail(dto.email)) as AuthUser | null;
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== Role.INSTITUTE && user.role !== Role.STUDENT) {
      throw new UnauthorizedException('This portal is only for institute and student accounts');
    }

    const scope = await this.resolveInstituteScope(user.id, user.role);
    const actualSlug = scope.institute_slug || this.normalizeInstituteSlug(scope.institute_name);
    const requestedSlug = this.normalizeInstituteSlug(instituteSlug);
    if (!actualSlug || actualSlug !== requestedSlug) {
      throw new UnauthorizedException('Account does not belong to this institute portal');
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  logout() {
    return { message: 'Logged out successfully' };
  }

  private buildAuthResponse(id: string, email: string, role: Role) {
    const payload = { sub: id, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id, email, role },
    };
  }

  private normalizeInstituteSlug(value: string) {
    return value.toLowerCase().replace(/[\s_-]+/g, '').replace(/[^a-z0-9]/g, '');
  }

  private async resolveInstituteScope(userId: string, role: Role) {
    if (role === Role.INSTITUTE) {
      const ownerResult = await this.prisma.query<InstituteScopeRecord>(
        `
        SELECT id AS institute_id, name AS institute_name, slug AS institute_slug
        FROM institutes
        WHERE owner_id = $1::uuid
        LIMIT 1
      `,
        [userId],
      );
      if (ownerResult.rows.length === 0) throw new UnauthorizedException('Institute account has no institute');
      return ownerResult.rows[0];
    }

    const studentResult = await this.prisma.query<InstituteScopeRecord>(
      `
      SELECT i.id AS institute_id, i.name AS institute_name, i.slug AS institute_slug
      FROM student_profiles sp
      JOIN institutes i ON i.id = sp.institute_id
      WHERE sp.user_id = $1::uuid
      LIMIT 1
    `,
      [userId],
    );
    if (studentResult.rows.length === 0) throw new UnauthorizedException('Student is not linked to institute');
    return studentResult.rows[0];
  }
}
