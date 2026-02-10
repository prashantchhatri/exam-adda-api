import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class InstitutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, ownerRole: Role, dto: CreateInstituteDto) {
    if (ownerRole !== Role.INSTITUTE && ownerRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only institute users can create an institute');
    }

    const existing = await this.prisma.institute.findUnique({
      where: { ownerId },
    });
    if (existing) throw new BadRequestException('User already owns an institute');

    return this.prisma.institute.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId,
      },
    });
  }

  async findMine(ownerId: string) {
    const institute = await this.prisma.institute.findUnique({
      where: { ownerId },
    });
    if (!institute) throw new NotFoundException('Institute not found');
    return institute;
  }
}
