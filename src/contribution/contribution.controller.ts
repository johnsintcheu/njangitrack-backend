import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ContributionService } from './contribution.service';

@Controller('contributions')
export class ContributionController {
  constructor(private readonly contributionService: ContributionService) {}

  @Post()
  recordContribution(
    @Body()
    body: {
      cycleId: string;
      memberId: string;
      amountXAF: number;
      paymentMethod: string;
      paymentDate: Date;
      note?: string;
      payerPhone?: string;
    },
  ) {
    return this.contributionService.recordContribution(body);
  }

  @Patch(':id/confirm')
  confirmContribution(
    @Param('id') id: string,
    @Body() body: { treasurerId: string },
  ) {
    return this.contributionService.confirmContribution(id, body.treasurerId);
  }

  @Get('cycle/:cycleId')
  getCycleContributions(@Param('cycleId') cycleId: string) {
    return this.contributionService.getCycleContributions(cycleId);
  }
}
