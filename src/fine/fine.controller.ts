import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { FineService } from './fine.service';

@Controller('fines')
export class FineController {
  constructor(private readonly fineService: FineService) {}

  @Post()
  triggerFine(
    @Body()
    body: {
      memberId: string;
      cycleId: string;
      amountXAF: number;
      reason: 'LATE' | 'ABSENCE';
    },
  ) {
    return this.fineService.triggerFine(body);
  }

  @Get('member/:memberId')
  getMemberFines(@Param('memberId') memberId: string) {
    return this.fineService.getMemberFines(memberId);
  }

  @Patch(':id/dispute')
  disputeFine(
    @Param('id') id: string,
    @Body() body: { disputeReason: string },
  ) {
    return this.fineService.disputeFine(id, body.disputeReason);
  }

  @Patch(':id/waive')
  waiveFine(
    @Param('id') id: string,
    @Body() body: { adminId: string },
  ) {
    return this.fineService.waiveFine(id, body.adminId);
  }
}
