import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { LoanService } from './loan.service';

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  createLoan(
    @Body()
    body: {
      borrowerId: string;
      groupId: string;
      principalXAF: number;
      monthlyInterestRate?: number;
    },
  ) {
    return this.loanService.createLoan(body);
  }

  @Patch(':id/repayment')
  recordRepayment(
    @Param('id') id: string,
    @Body() body: { amountXAF: number },
  ) {
    return this.loanService.recordRepayment(id, body.amountXAF);
  }

  @Get('borrower/:borrowerId')
  getLoansByBorrower(@Param('borrowerId') borrowerId: string) {
    return this.loanService.getLoansByBorrower(borrowerId);
  }

  @Get('group/:groupId')
  getActiveLoansByGroup(@Param('groupId') groupId: string) {
    return this.loanService.getActiveLoansByGroup(groupId);
  }
}
