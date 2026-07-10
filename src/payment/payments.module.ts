import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MtnMoMoProvider } from './providers/mtn-momo.provider';
import { OrangeMoneyProvider } from './providers/orange-money.provider';
import { PaymentVerificationAgent } from './agents/payment-verification.agent';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MtnMoMoProvider,
    OrangeMoneyProvider,
    PaymentVerificationAgent,
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
