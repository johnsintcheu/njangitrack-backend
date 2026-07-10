import { Module } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { ContributionController } from './contribution.controller';
import { PaymentsModule } from '../payment/payments.module';

@Module({
  imports: [PaymentsModule],
  providers: [ContributionService],
  controllers: [ContributionController],
})
export class ContributionModule {}
