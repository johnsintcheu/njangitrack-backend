import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContributionMonitorAgent {
  private readonly logger = new Logger(ContributionMonitorAgent.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorContributions() {
    this.logger.log('🤖 Contribution Monitor Agent running...');

    const pendingFines = await this.prisma.fine.findMany({
      where: { status: 'OUTSTANDING' },
    });

    if (pendingFines.length === 0) {
      this.logger.log('✅ No outstanding fines at this time.');
      return;
    }

    this.logger.log(
      `⚠️  Found ${pendingFines.length} outstanding fines.`,
    );

    for (const fine of pendingFines) {
      this.logger.log(
        `📋 Fine ${fine.id} — Member: ${fine.memberId} — Amount: ${fine.amountXAF} XAF — Reason: ${fine.reason}`,
      );
    }
  }

  async autoTriggerFinesForCycle(
    cycleId: string,
    pendingMemberIds: string[],
    fineAmountXAF: number,
  ) {
    this.logger.log(
      `🤖 Auto-triggering fines for ${pendingMemberIds.length} members in cycle ${cycleId}`,
    );

    for (const memberId of pendingMemberIds) {
      const fine = await this.prisma.fine.create({
        data: {
          memberId,
          cycleId,
          amountXAF: fineAmountXAF,
          reason: 'LATE',
          status: 'OUTSTANDING',
        },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'FINE',
          entityId: fine.id,
          actionType: 'FINE_AUTO_TRIGGERED',
          newValue: JSON.stringify(fine),
          actorId: 'CONTRIBUTION_MONITOR_AGENT',
          actorType: 'AGENT',
        },
      });

      this.logger.log(
        `✅ Fine auto-triggered for member ${memberId} — ${fineAmountXAF} XAF`,
      );
    }
  }
}