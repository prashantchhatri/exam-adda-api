import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

type UserRow = {
  id: string;
  email: string;
  password: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    const result = await this.prisma.query<UserRow>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] || null;
  }

  async findById(id: string) {
    const result = await this.prisma.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] || null;
  }

  async create(
    email: string,
    password: string,
    role: Role,
    fullName?: string | null,
    phone?: string | null,
  ) {
    const existing = await this.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.prisma.query<UserRow>(
      `
      INSERT INTO users (id, email, password, role, full_name, phone)
      VALUES ($1::uuid, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [id, email, passwordHash, role, fullName || null, phone || null],
    );

    return result.rows[0];
  }

  async createStudent(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    instituteId: string,
  ) {
    const existing = await this.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');

    const institute = await this.prisma.query<{ id: string }>(
      'SELECT id FROM institutes WHERE id = $1::uuid LIMIT 1',
      [instituteId],
    );
    if (institute.rows.length === 0) throw new NotFoundException('Institute not found');

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.transaction(async (client) => {
      await client.query(
        `
        INSERT INTO users (id, email, password, role, full_name, phone)
        VALUES ($1::uuid, $2, $3, $4, $5, $6)
      `,
        [id, email, passwordHash, Role.STUDENT, fullName, phone],
      );

      await client.query(
        `
        INSERT INTO student_profiles (user_id, institute_id, full_name)
        VALUES ($1::uuid, $2::uuid, $3)
      `,
        [id, instituteId, fullName],
      );
    });

    const created = await this.findById(id);
    if (!created) throw new NotFoundException('User creation failed');
    return created;
  }
}
