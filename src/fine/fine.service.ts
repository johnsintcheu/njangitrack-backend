import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FineService {
  constructor(private prisma: PrismaService) {}

  async triggerFine(data: {
    memberId: string;
    cycleId: string;
    amountXAF: number;
    reason: 'LATE' | 'ABSENCE';
  }) {
    const fine = await this.prisma.fine.create({
      data: {
        memberId: data.memberId,
        cycleId: data.cycleId,
        amountXAF: data.amountXAF,
        reason: data.reason,
        status: 'OUTSTANDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'FINE',
        entityId: fine.id,
        actionType: 'FINE_TRIGGERED',
        newValue: JSON.stringify(fine),
        actorId: 'CONTRIBUTION_MONITOR_AGENT',
        actorType: 'AGENT',
      },
    });

    return fine;
  }

  async getMemberFines(memberId: string) {
    return this.prisma.fine.findMany({
      where: { memberId },
    });
  }

  async disputeFine(fineId: string, disputeReason: string) {
    const fine = await this.prisma.fine.update({
      where: { id: fineId },
      data: {
        status: 'DISPUTED',
        disputeReason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'FINE',
        entityId: fineId,
        actionType: 'FINE_DISPUTED',
        newValue: JSON.stringify(fine),
        actorId: fine.memberId,
        actorType: 'HUMAN',
      },
    });

    return fine;
  }

  async waiveFine(fineId: string, adminId: string) {
    const fine = await this.prisma.fine.update({
      where: { id: fineId },
      data: {
        status: 'WAIVED',
        resolvedBy: adminId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'FINE',
        entityId: fineId,
        actionType: 'FINE_WAIVED',
        newValue: JSON.stringify(fine),
        actorId: adminId,
        actorType: 'HUMAN',
      },
    });

    return fine;
  }
}
