import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MtnMoMoProvider } from './providers/mtn-momo.provider';
import { OrangeMoneyProvider } from './providers/orange-money.provider';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private mtnMoMo: MtnMoMoProvider,
    private orangeMoney: OrangeMoneyProvider,
  ) {}

  private getProvider(method: string) {
    switch (method) {
      case 'MTN_MOMO': return this.mtnMoMo;
      case 'ORANGE_MONEY': return this.orangeMoney;
      default: return null;
    }
  }

  async initiatePayment(dto: InitiatePaymentDto) {
    const provider = this.getProvider(dto.paymentMethod);
    if (!provider) {
      return { success: false, message: `Unsupported payment method: ${dto.paymentMethod}` };
    }

    const result = await provider.requestToPay({
      amount: dto.amount.toString(),
      currency: dto.currency || 'XAF',
      payerPhone: dto.payerPhone,
      externalId: dto.contributionId,
      payerMessage: 'Njangi contribution payment',
      payeeNote: 'Thank you for your contribution',
    });

    if (result.success && result.status === 'SUCCESSFUL') {
      await this.prisma.contribution.update({
        where: { id: dto.contributionId },
        data: {
          status: 'CONFIRMED',
          verifiedBy: `${dto.paymentMethod}_AUTO`,
          verifiedAt: new Date(),
        },
      });
      this.logger.log(`✅ Contribution ${dto.contributionId} auto-confirmed via ${dto.paymentMethod}`);
    }

    return result;
  }

  async handleMtnMoMoWebhook(body: Record<string, any>) {
    const referenceId = body.referenceId;
    if (!referenceId) return { received: true };

    const status = body.status === 'SUCCESSFUL' ? 'CONFIRMED' : 'DISPUTED';
    if (status === 'CONFIRMED') {
      const contribution = await this.prisma.contribution.findFirst({
        where: { id: referenceId },
      });
      if (contribution && contribution.status === 'PENDING') {
        await this.prisma.contribution.update({
          where: { id: referenceId },
          data: { status: 'CONFIRMED', verifiedBy: 'MTN_MOMO_WEBHOOK', verifiedAt: new Date() },
        });
        this.logger.log(`✅ Contribution ${referenceId} confirmed via MTN MoMo webhook`);
      }
    }

    return { received: true };
  }

  async handleOrangeMoneyWebhook(body: Record<string, any>) {
    const externalId = body.externalId || body.paymentId;
    if (!externalId) return { received: true };

    const status = body.status === 'SUCCESS' ? 'CONFIRMED' : 'DISPUTED';
    if (status === 'CONFIRMED') {
      const contribution = await this.prisma.contribution.findFirst({
        where: { id: externalId },
      });
      if (contribution && contribution.status === 'PENDING') {
        await this.prisma.contribution.update({
          where: { id: externalId },
          data: { status: 'CONFIRMED', verifiedBy: 'ORANGE_MONEY_WEBHOOK', verifiedAt: new Date() },
        });
        this.logger.log(`✅ Contribution ${externalId} confirmed via Orange Money webhook`);
      }
    }

    return { received: true };
  }

  async verifyPendingPayments() {
    const pendingContribs = await this.prisma.contribution.findMany({
      where: {
        paymentMethod: { in: ['MTN_MOMO', 'ORANGE_MONEY'] },
        status: 'PENDING',
      },
    });

    let verified = 0;
    for (const contrib of pendingContribs) {
      try {
        const provider = this.getProvider(contrib.paymentMethod);
        if (!provider) continue;

        const result = await provider.checkPaymentStatus(contrib.id);
        if (result.status === 'SUCCESSFUL') {
          await this.prisma.contribution.update({
            where: { id: contrib.id },
            data: { status: 'CONFIRMED', verifiedBy: `${contrib.paymentMethod}_VERIFIER`, verifiedAt: new Date() },
          });
          verified++;
          this.logger.log(`✅ Contribution ${contrib.id} verified via status check`);
        }
      } catch (err: any) {
        this.logger.error(`❌ Error verifying contribution ${contrib.id}: ${err.message}`);
      }
    }

    return verified;
  }
}
