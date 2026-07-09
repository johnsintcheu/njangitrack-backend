import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        contributionAmount: dto.contributionAmount,
        frequency: dto.frequency,
        startDate: new Date(dto.startDate),
        adminId: 'SYSTEM',
      },
    });

    this.logger.log(`✅ Group created: ${group.name} (${group.id})`);
    return group;
  }

  async findAll() {
    return this.prisma.group.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.group.findUnique({ where: { id } });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.group.update({ where: { id }, data });
  }
}
