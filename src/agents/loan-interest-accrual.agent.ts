import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoanInterestAccrualAgent {
  private readonly logger = new Logger(LoanInterestAccrualAgent.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async accrueInterest() {
    this.logger.log('🤖 Loan Interest Accrual Agent running...');

    const activeLoans = await this.prisma.loan.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeLoans.length === 0) {
      this.logger.log('✅ No active loans at this time.');
      return;
    }

    this.logger.log(`📊 Processing ${activeLoans.length} active loans...`);

    for (const loan of activeLoans) {
      const dailyInterestRate = loan.monthlyInterestRate / 30 / 100;
      const dailyInterest =
        Number(loan.outstandingBalanceXAF) * dailyInterestRate;
      const newBalance = Number(loan.outstandingBalanceXAF) + dailyInterest;

      await this.prisma.loan.update({
        where: { id: loan.id },
        data: {
          outstandingBalanceXAF: newBalance,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'LOAN',
          entityId: loan.id,
          actionType: 'INTEREST_ACCRUED',
          previousValue: JSON.stringify({
            balance: loan.outstandingBalanceXAF,
          }),
          newValue: JSON.stringify({
            balance: newBalance,
            interestAdded: dailyInterest,
          }),
          actorId: 'LOAN_INTEREST_ACCRUAL_AGENT',
          actorType: 'AGENT',
        },
      });

      this.logger.log(
        `💰 Loan ${loan.id} — Interest added: ${dailyInterest.toFixed(0)} XAF — New balance: ${newBalance.toFixed(0)} XAF`,
      );
    }
  }
}