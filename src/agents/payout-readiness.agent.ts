import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutReadinessAgent {
  private readonly logger = new Logger(PayoutReadinessAgent.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPayoutReadiness() {
    const start = Date.now();
    this.logger.log('🤖 Payout Readiness Agent running...');

    let processed = 0;
    try {
      const activeCycles = await this.prisma.cycle.findMany({
        where: { status: 'ACTIVE' },
        include: { contributions: true },
      });

      for (const cycle of activeCycles) {
        const total = cycle.contributions.length;
        if (total === 0) continue;

        const confirmed = cycle.contributions.filter(
          (c) => c.status === 'CONFIRMED',
        ).length;

        const percentage = (confirmed / total) * 100;

        await this.prisma.cycle.update({
          where: { id: cycle.id },
          data: {
            confirmationPercent: percentage,
            status: percentage === 100 ? 'PAYOUT_READY' : 'ACTIVE',
          },
        });

        if (percentage === 100) {
          this.logger.log(
            `✅ Cycle ${cycle.id} is PAYOUT READY! Notifying administrator...`,
          );

          await this.prisma.auditLog.create({
            data: {
              entityType: 'CYCLE',
              entityId: cycle.id,
              actionType: 'PAYOUT_READY',
              newValue: JSON.stringify({ percentage: 100 }),
              actorId: 'PAYOUT_READINESS_AGENT',
              actorType: 'AGENT',
            },
          });
        } else {
          this.logger.log(
            `📊 Cycle ${cycle.id}: ${percentage.toFixed(1)}% confirmed`,
          );
        }
        processed++;
      }

      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Payout Readiness Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
        create: {
          agentName: 'Payout Readiness Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
      });
    } catch (e) {
      this.logger.error('❌ Payout Readiness Agent error', e);
      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Payout Readiness Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          status: 'ERROR',
        },
        create: {
          agentName: 'Payout Readiness Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: 0,
          status: 'ERROR',
        },
      });
    }
  }
}