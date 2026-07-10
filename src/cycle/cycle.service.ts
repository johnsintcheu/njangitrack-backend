import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CycleService {
  constructor(private prisma: PrismaService) {}

  async createCycle(data: {
    groupId: string;
    cycleNumber: number;
    potAmountXAF: number;
    startDate: Date;
    rotationAlgorithm?: string;
  }) {
    return this.prisma.cycle.create({
      data: {
        groupId: data.groupId,
        cycleNumber: data.cycleNumber,
        potAmountXAF: data.potAmountXAF,
        startDate: data.startDate,
        rotationAlgorithm: data.rotationAlgorithm || 'sequential',
      },
    });
  }

  async getActiveCycle(groupId: string) {
    return this.prisma.cycle.findFirst({
      where: { groupId, status: 'ACTIVE' },
      include: { contributions: true },
    });
  }

  async checkPayoutReadiness(cycleId: string, totalMembers: number) {
    const confirmed = await this.prisma.contribution.count({
      where: { cycleId, status: 'CONFIRMED' },
    });

    const percentage = (confirmed / totalMembers) * 100;

    await this.prisma.cycle.update({
      where: { id: cycleId },
      data: {
        confirmationPercent: percentage,
        status: percentage === 100 ? 'PAYOUT_READY' : 'ACTIVE',
      },
    });

    return {
      confirmed,
      totalMembers,
      percentage,
      isReady: percentage === 100,
    };
  }
}
