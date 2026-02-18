import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  role: string;
  created_at: Date;
};

type InstituteRecord = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  owner_id: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  show_info_on_login: boolean | null;
  created_at: Date;
};

type StudentRecord = {
  user_id: string;
  full_name: string;
  institute_id: string;
  created_at: Date;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuperAdminData() {
    const [usersResult, institutesResult, studentsResult] = await Promise.all([
      this.prisma.query<UserRecord>('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'),
      this.prisma.query<InstituteRecord>(
        `SELECT id, name, slug, description, owner_id, logo_url, address, phone, show_info_on_login, created_at
         FROM institutes
         ORDER BY created_at DESC`,
      ),
      this.prisma.query<StudentRecord>(
        'SELECT user_id, full_name, institute_id, created_at FROM student_profiles ORDER BY created_at DESC',
      ),
    ]);

    const users = usersResult.rows;
    const institutes = institutesResult.rows;
    const students = studentsResult.rows;

    const userMap = new Map<string, UserRecord>(users.map((item) => [item.id, item]));
    const instituteMap = new Map<string, InstituteRecord>(institutes.map((item) => [item.id, item]));

    return {
      counts: {
        users: users.length,
        institutes: institutes.length,
        students: students.length,
      },
      users: users.map((item) => ({
        id: item.id,
        email: item.email,
        role: item.role,
        createdAt: item.created_at,
      })),
      institutes: institutes.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        logoUrl: item.logo_url,
        address: item.address,
        phone: item.phone,
        showInfoOnLogin: !!item.show_info_on_login,
        owner: {
          id: item.owner_id,
          email: userMap.get(item.owner_id)?.email || 'N/A',
        },
        createdAt: item.created_at,
      })),
      students: students.map((item) => ({
        id: item.user_id,
        fullName: item.full_name,
        user: {
          id: item.user_id,
          email: userMap.get(item.user_id)?.email || 'N/A',
        },
        institute: {
          id: item.institute_id,
          name: instituteMap.get(item.institute_id)?.name || 'N/A',
        },
        createdAt: item.created_at,
      })),
    };
  }

  async getInstituteData(ownerId: string) {
    const instituteResult = await this.prisma.query<InstituteRecord>(
      `SELECT id, name, slug, description, owner_id, logo_url, address, phone, show_info_on_login, created_at
       FROM institutes
       WHERE owner_id = $1::uuid
       LIMIT 1`,
      [ownerId],
    );

    if (instituteResult.rows.length === 0) throw new NotFoundException('Institute not found');
    const institute = instituteResult.rows[0];

    const studentsResult = await this.prisma.query<StudentRecord>(
      'SELECT user_id, full_name, institute_id, created_at FROM student_profiles WHERE institute_id = $1::uuid ORDER BY created_at DESC',
      [institute.id],
    );
    const studentUserIds = studentsResult.rows.map((item) => item.user_id);

    const usersResult = await this.prisma.query<UserRecord>(
      'SELECT id, email, role, created_at FROM users WHERE id = ANY($1::uuid[])',
      [studentUserIds.length > 0 ? studentUserIds : ['00000000-0000-0000-0000-000000000000']],
    );
    const userMap = new Map<string, UserRecord>(usersResult.rows.map((item) => [item.id, item]));

    return {
      institute: {
        id: institute.id,
        name: institute.name,
        slug: institute.slug,
        description: institute.description,
        logoUrl: institute.logo_url,
        address: institute.address,
        phone: institute.phone,
        showInfoOnLogin: !!institute.show_info_on_login,
        students: studentsResult.rows.map((item) => ({
          id: item.user_id,
          fullName: item.full_name,
          user: {
            id: item.user_id,
            email: userMap.get(item.user_id)?.email || 'N/A',
          },
        })),
      },
      counts: {
        students: studentsResult.rows.length,
      },
    };
  }

  async getStudentData(userId: string) {
    const studentResult = await this.prisma.query<StudentRecord>(
      'SELECT user_id, full_name, institute_id, created_at FROM student_profiles WHERE user_id = $1::uuid LIMIT 1',
      [userId],
    );

    if (studentResult.rows.length === 0) throw new NotFoundException('Student profile not found');
    const student = studentResult.rows[0];

    const [userResult, instituteResult] = await Promise.all([
      this.prisma.query<UserRecord>('SELECT id, email, role, created_at FROM users WHERE id = $1::uuid LIMIT 1', [
        student.user_id,
      ]),
      this.prisma.query<InstituteRecord>(
        `SELECT id, name, slug, description, owner_id, logo_url, address, phone, show_info_on_login, created_at
         FROM institutes
         WHERE id = $1::uuid
         LIMIT 1`,
        [student.institute_id],
      ),
    ]);

    if (userResult.rows.length === 0 || instituteResult.rows.length === 0) {
      throw new NotFoundException('Student profile not found');
    }

    const user = userResult.rows[0];
    const institute = instituteResult.rows[0];

    return {
      id: student.user_id,
      fullName: student.full_name,
      user: {
        id: user.id,
        email: user.email,
      },
      institute: {
        id: institute.id,
        name: institute.name,
        slug: institute.slug,
        description: institute.description,
        logoUrl: institute.logo_url,
        address: institute.address,
        phone: institute.phone,
        showInfoOnLogin: !!institute.show_info_on_login,
      },
    };
  }
}
