import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiatePayment(dto);
  }

  @Post('webhook/mtn-momo')
  mtnMoMoWebhook(@Body() body: Record<string, any>) {
    return this.paymentService.handleMtnMoMoWebhook(body);
  }

  @Post('webhook/orange-money')
  orangeMoneyWebhook(@Body() body: Record<string, any>) {
    return this.paymentService.handleOrangeMoneyWebhook(body);
  }
}
