import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CycleService } from './cycle.service';

@Controller('cycles')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Post()
  createCycle(
    @Body()
    body: {
      groupId: string;
      cycleNumber: number;
      potAmountXAF: number;
      startDate: Date;
      rotationAlgorithm?: string;
    },
  ) {
    return this.cycleService.createCycle(body);
  }

  @Get('active/:groupId')
  getActiveCycle(@Param('groupId') groupId: string) {
    return this.cycleService.getActiveCycle(groupId);
  }

  @Get(':cycleId/payout-readiness/:totalMembers')
  checkPayoutReadiness(
    @Param('cycleId') cycleId: string,
    @Param('totalMembers') totalMembers: string,
  ) {
    return this.cycleService.checkPayoutReadiness(cycleId, parseInt(totalMembers));
  }
}