import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class ContributionService {
  private readonly logger = new Logger(ContributionService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async recordContribution(data: {
    cycleId: string;
    memberId: string;
    amountXAF: number;
    paymentMethod: string;
    paymentDate: Date;
    note?: string;
    payerPhone?: string;
  }) {
    const contribution = await this.prisma.contribution.create({
      data: {
        cycleId: data.cycleId,
        memberId: data.memberId,
        amountXAF: data.amountXAF,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        note: data.note,
        status: 'PENDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'CONTRIBUTION',
        entityId: contribution.id,
        actionType: 'CREATED',
        newValue: JSON.stringify(contribution),
        actorId: data.memberId,
        actorType: 'HUMAN',
      },
    });

    if (data.paymentMethod === 'MTN_MOMO' || data.paymentMethod === 'ORANGE_MONEY') {
      const phone = data.payerPhone || '';
      if (phone) {
        this.logger.log(`📱 Initiating ${data.paymentMethod} payment for ${phone}...`);
        await this.paymentService.initiatePayment({
          contributionId: contribution.id,
          amount: data.amountXAF,
          payerPhone: phone,
          paymentMethod: data.paymentMethod,
        });
      }
    }

    return contribution;
  }

  async confirmContribution(contributionId: string, treasurerId: string) {
    const contribution = await this.prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: 'CONFIRMED',
        verifiedBy: treasurerId,
        verifiedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'CONTRIBUTION',
        entityId: contributionId,
        actionType: 'CONFIRMED',
        newValue: JSON.stringify(contribution),
        actorId: treasurerId,
        actorType: 'HUMAN',
      },
    });

    return contribution;
  }

  async getCycleContributions(cycleId: string) {
    return this.prisma.contribution.findMany({
      where: { cycleId },
    });
  }
}