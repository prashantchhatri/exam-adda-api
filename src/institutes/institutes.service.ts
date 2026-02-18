import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { Role } from '../common/enums/role.enum';
import { UpdateInstituteDetailsDto } from './dto/update-institute-details.dto';

type InstituteRow = {
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
  updated_at: Date;
};

@Injectable()
export class InstitutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, ownerRole: Role, dto: CreateInstituteDto) {
    if (ownerRole !== Role.INSTITUTE && ownerRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only institute users can create an institute');
    }

    const existing = await this.prisma.query<InstituteRow>(
      'SELECT * FROM institutes WHERE owner_id = $1::uuid LIMIT 1',
      [ownerId],
    );
    if (existing.rows.length > 0) throw new BadRequestException('User already owns an institute');

    const result = await this.prisma.query<InstituteRow>(
      `
      INSERT INTO institutes (id, name, slug, description, owner_id)
      VALUES ($1::uuid, $2, $3, $4, $5::uuid)
      RETURNING *
      `,
      [randomUUID(), dto.name, this.normalizeSlug(dto.name), dto.description || null, ownerId],
    );

    return this.mapInstitute(result.rows[0]);
  }

  async findMine(ownerId: string) {
    const result = await this.prisma.query<InstituteRow>(
      'SELECT * FROM institutes WHERE owner_id = $1::uuid LIMIT 1',
      [ownerId],
    );
    if (result.rows.length === 0) throw new NotFoundException('Institute not found');
    return this.mapInstitute(result.rows[0]);
  }

  async updateMineDetails(ownerId: string, dto: UpdateInstituteDetailsDto) {
    const existing = await this.prisma.query<InstituteRow>(
      'SELECT * FROM institutes WHERE owner_id = $1::uuid LIMIT 1',
      [ownerId],
    );
    if (existing.rows.length === 0) throw new NotFoundException('Institute not found');

    const current = existing.rows[0];
    const result = await this.prisma.query<InstituteRow>(
      `
      UPDATE institutes
      SET
        logo_url = $2,
        address = $3,
        phone = $4,
        show_info_on_login = $5,
        updated_at = NOW()
      WHERE owner_id = $1::uuid
      RETURNING *
      `,
      [
        ownerId,
        dto.logoUrl ?? current.logo_url,
        dto.address ?? current.address,
        dto.phone ?? current.phone,
        dto.showInfoOnLogin ?? current.show_info_on_login ?? false,
      ],
    );

    return this.mapInstitute(result.rows[0]);
  }

  async findAllPublic() {
    const result = await this.prisma.query<InstituteRow>('SELECT * FROM institutes ORDER BY created_at DESC');
    return result.rows.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug || this.normalizeSlug(item.name),
      logoUrl: item.logo_url,
    }));
  }

  async findPublicBySlug(slug: string) {
    const normalized = this.normalizeSlug(slug);
    const result = await this.prisma.query<InstituteRow>(
      `
      SELECT *
      FROM institutes
      WHERE slug = $1
         OR regexp_replace(lower(name), '[^a-z0-9]', '', 'g') = $1
      LIMIT 1
      `,
      [normalized],
    );
    if (result.rows.length === 0) throw new NotFoundException('Institute login URL not found');

    const institute = this.mapInstitute(result.rows[0]);
    return {
      id: institute.id,
      name: institute.name,
      slug: institute.slug,
      logoUrl: institute.logoUrl,
      address: institute.showInfoOnLogin ? institute.address : null,
      phone: institute.showInfoOnLogin ? institute.phone : null,
      showInfoOnLogin: institute.showInfoOnLogin,
    };
  }

  private mapInstitute(institute: InstituteRow) {
    const normalizedSlug = institute.slug || this.normalizeSlug(institute.name);
    return {
      id: institute.id,
      name: institute.name,
      slug: normalizedSlug,
      description: institute.description,
      ownerId: institute.owner_id,
      logoUrl: institute.logo_url,
      address: institute.address,
      phone: institute.phone,
      showInfoOnLogin: !!institute.show_info_on_login,
      createdAt: institute.created_at,
      updatedAt: institute.updated_at,
    };
  }

  private normalizeSlug(value: string) {
    return value.toLowerCase().replace(/[\s_-]+/g, '').replace(/[^a-z0-9]/g, '');
  }
}
