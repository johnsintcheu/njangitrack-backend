import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        quartier: true,
        role: true,
        kycStatus: true,
        isActive: true,
        language: true,
        createdAt: true,
      },
    });
  }

  async invite(phoneNumber: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      return { message: 'User already registered', userId: existing.id };
    }

    const user = await this.prisma.user.create({
      data: {
        phoneNumber,
        fullName: 'Invited Member',
        passwordHash: '',
        role: 'MEMBER',
        isActive: false,
      },
    });

    this.logger.log(`📨 Invitation sent to ${phoneNumber} (user ${user.id})`);

    return {
      message: 'Invitation sent successfully',
      userId: user.id,
    };
  }
}
