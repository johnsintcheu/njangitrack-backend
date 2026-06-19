import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoanService {
  constructor(private prisma: PrismaService) {}

  async createLoan(data: {
    borrowerId: string;
    groupId: string;
    principalXAF: number;
    monthlyInterestRate?: number;
  }) {
    const loan = await this.prisma.loan.create({
      data: {
        borrowerId: data.borrowerId,
        groupId: data.groupId,
        principalXAF: data.principalXAF,
        outstandingBalanceXAF: data.principalXAF,
        monthlyInterestRate: data.monthlyInterestRate || 8,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'LOAN',
        entityId: loan.id,
        actionType: 'LOAN_CREATED',
        newValue: JSON.stringify(loan),
        actorId: data.borrowerId,
        actorType: 'HUMAN',
      },
    });

    return loan;
  }

  async recordRepayment(loanId: string, amountXAF: number) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    const newBalance = Number(loan.outstandingBalanceXAF) - amountXAF;

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        outstandingBalanceXAF: newBalance,
        status: newBalance <= 0 ? 'REPAID' : 'ACTIVE',
      },
    });

    await this.prisma.repayment.create({
      data: {
        loanId,
        amountXAF,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'LOAN',
        entityId: loanId,
        actionType: 'REPAYMENT_RECORDED',
        newValue: JSON.stringify({ amountXAF, newBalance }),
        actorId: loan.borrowerId,
        actorType: 'HUMAN',
      },
    });

    return updatedLoan;
  }

  async getLoansByBorrower(borrowerId: string) {
    return this.prisma.loan.findMany({
      where: { borrowerId },
      include: { repayments: true },
    });
  }

  async getActiveLoansByGroup(groupId: string) {
    return this.prisma.loan.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { repayments: true },
    });
  }
}