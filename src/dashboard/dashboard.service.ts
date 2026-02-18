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

type UserView = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

type InstituteView = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  showInfoOnLogin: boolean;
  owner: {
    id: string;
    email: string;
  };
  createdAt: Date;
};

type StudentView = {
  id: string;
  fullName: string;
  user: {
    id: string;
    email: string;
  };
  institute: {
    id: string;
    name: string;
  };
  createdAt: Date;
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

    const userViews = users.map((item) => this.mapUser(item));
    const instituteViews = institutes.map((item) => this.mapInstitute(item, userMap));
    const studentViews = students.map((item) => this.mapStudent(item, userMap, instituteMap));

    const stats = {
      totalUsers: users.length,
      totalInstitutes: institutes.length,
      totalStudents: students.length,
    };

    return {
      // New response contract
      stats,
      recentUsers: userViews.slice(0, 10),
      recentInstitutes: instituteViews.slice(0, 10),

      // Backward compatibility
      counts: {
        users: stats.totalUsers,
        institutes: stats.totalInstitutes,
        students: stats.totalStudents,
      },
      users: userViews,
      institutes: instituteViews,
      students: studentViews,
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

  private mapUser(user: UserRecord): UserView {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  }

  private mapInstitute(institute: InstituteRecord, userMap: Map<string, UserRecord>): InstituteView {
    return {
      id: institute.id,
      name: institute.name,
      slug: institute.slug,
      description: institute.description,
      logoUrl: institute.logo_url,
      address: institute.address,
      phone: institute.phone,
      showInfoOnLogin: !!institute.show_info_on_login,
      owner: {
        id: institute.owner_id,
        email: userMap.get(institute.owner_id)?.email || 'N/A',
      },
      createdAt: institute.created_at,
    };
  }

  private mapStudent(
    student: StudentRecord,
    userMap: Map<string, UserRecord>,
    instituteMap: Map<string, InstituteRecord>,
  ): StudentView {
    return {
      id: student.user_id,
      fullName: student.full_name,
      user: {
        id: student.user_id,
        email: userMap.get(student.user_id)?.email || 'N/A',
      },
      institute: {
        id: student.institute_id,
        name: instituteMap.get(student.institute_id)?.name || 'N/A',
      },
      createdAt: student.created_at,
    };
  }
}
