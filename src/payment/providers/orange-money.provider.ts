import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentRequest, PaymentResult } from './payment-provider.interface';

@Injectable()
export class OrangeMoneyProvider implements PaymentProvider {
  readonly name = 'ORANGE_MONEY';
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get('ORANGE_MONEY_BASE_URL') || 'https://api.orange.com';
    this.clientId = this.config.get('ORANGE_MONEY_CLIENT_ID', '');
    this.clientSecret = this.config.get('ORANGE_MONEY_CLIENT_SECRET', '');
    this.callbackUrl = this.config.get('ORANGE_MONEY_CALLBACK_URL', '');
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  async requestToPay(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured) {
      this.logger.warn('⚠️ Orange Money not configured — returning simulated success');
      return { success: true, status: 'SUCCESSFUL', providerReference: `sim_${Date.now()}` };
    }

    try {
      await this.ensureToken();

      const body = {
        amount: { value: request.amount, unit: request.currency },
        customer: { 'payer-phone': request.payerPhone },
        metadata: { externalId: request.externalId },
      };

      const response = await fetch(`${this.baseUrl}/orange-money/cameroon/v1/payment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        this.logger.log(`✅ Orange Money request initiated: ${data.paymentId || 'unknown'}`);
        return {
          success: true,
          status: 'PENDING',
          providerReference: data.paymentId || null,
        };
      }

      const errorText = await response.text();
      this.logger.error(`❌ Orange Money request failed: ${response.status} ${errorText}`);
      return { success: false, status: 'FAILED', message: `Orange API error: ${response.status}` };
    } catch (err: any) {
      this.logger.error(`❌ Orange Money request error: ${err.message}`);
      return { success: false, status: 'FAILED', message: err.message };
    }
  }

  async checkPaymentStatus(referenceId: string): Promise<PaymentResult> {
    if (referenceId.startsWith('sim_')) {
      return { success: true, status: 'SUCCESSFUL', providerReference: referenceId };
    }

    try {
      await this.ensureToken();
      const response = await fetch(
        `${this.baseUrl}/orange-money/cameroon/v1/payment/status/${referenceId}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.status === 'SUCCESS' ? 'SUCCESSFUL'
          : data.status === 'FAILED' ? 'FAILED' : 'PENDING';
        return { success: status === 'SUCCESSFUL', status, providerReference: referenceId };
      }

      return { success: false, status: 'FAILED', message: 'Status check failed' };
    } catch (err: any) {
      this.logger.error(`❌ Orange Money status check error: ${err.message}`);
      return { success: false, status: 'FAILED', message: err.message };
    }
  }

  private async ensureToken(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return;

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (response.ok) {
      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    } else {
      throw new Error(`Orange Money auth failed: ${response.status}`);
    }
  }
}
