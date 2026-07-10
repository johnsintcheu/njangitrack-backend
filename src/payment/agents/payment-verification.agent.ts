import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../payment.service';

@Injectable()
export class PaymentVerificationAgent {
  private readonly logger = new Logger(PaymentVerificationAgent.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyPendingMobileMoneyPayments() {
    const start = Date.now();
    this.logger.log('🤖 Payment Verification Agent running...');

    let processed = 0;
    try {
      const verified = await this.paymentService.verifyPendingPayments();
      processed = verified;

      if (verified > 0) {
        this.logger.log(`✅ Auto-verified ${verified} pending mobile money payments`);
      } else {
        this.logger.log('✅ No pending mobile money payments to verify');
      }

      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Payment Verification Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
        create: {
          agentName: 'Payment Verification Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
      });
    } catch (e) {
      this.logger.error('❌ Payment Verification Agent error', e);
      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Payment Verification Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          status: 'ERROR',
        },
        create: {
          agentName: 'Payment Verification Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: 0,
          status: 'ERROR',
        },
      });
    }
  }
}
