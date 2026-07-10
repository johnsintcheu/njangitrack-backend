import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentRequest, PaymentResult } from './payment-provider.interface';

@Injectable()
export class MtnMoMoProvider implements PaymentProvider {
  readonly name = 'MTN_MOMO';
  private readonly logger = new Logger(MtnMoMoProvider.name);
  private readonly baseUrl: string;
  private readonly subscriptionKey: string;
  private readonly apiUser: string;
  private readonly apiKey: string;
  private readonly environment: string;
  private readonly callbackUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get('MTN_MOMO_BASE_URL') || 'https://sandbox.momodeveloper.mtn.com';
    this.subscriptionKey = this.config.get('MTN_MOMO_SUBSCRIPTION_KEY', '');
    this.apiUser = this.config.get('MTN_MOMO_API_USER', '');
    this.apiKey = this.config.get('MTN_MOMO_API_KEY', '');
    this.environment = this.config.get('MTN_MOMO_ENVIRONMENT', 'sandbox');
    this.callbackUrl = this.config.get('MTN_MOMO_CALLBACK_URL', '');
  }

  get isConfigured(): boolean {
    return !!(this.subscriptionKey && this.apiUser && this.apiKey);
  }

  async requestToPay(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured) {
      this.logger.warn('⚠️ MTN MoMo not configured — returning simulated success');
      return { success: true, status: 'SUCCESSFUL', providerReference: `sim_${Date.now()}` };
    }

    try {
      await this.ensureToken();
      const referenceId = crypto.randomUUID();

      const body = {
        amount: request.amount,
        currency: request.currency,
        externalId: request.externalId,
        payer: { partyIdType: 'MSISDN', partyId: request.payerPhone },
        payerMessage: request.payerMessage || 'Njangi contribution',
        payeeNote: request.payeeNote || 'Thank you',
      };

      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'X-Reference-Id': referenceId,
          'X-Target-Environment': this.environment,
          Authorization: `Bearer ${this.token}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 202) {
        this.logger.log(`✅ MTN MoMo request initiated: ${referenceId}`);
        return { success: true, status: 'PENDING', providerReference: referenceId };
      }

      const errorText = await response.text();
      this.logger.error(`❌ MTN MoMo request failed: ${response.status} ${errorText}`);
      return { success: false, status: 'FAILED', message: `MTN API error: ${response.status}` };
    } catch (err: any) {
      this.logger.error(`❌ MTN MoMo request error: ${err.message}`);
      return { success: false, status: 'FAILED', message: err.message };
    }
  }

  async checkPaymentStatus(referenceId: string): Promise<PaymentResult> {
    if (!this.isConfigured || referenceId.startsWith('sim_')) {
      return { success: true, status: 'SUCCESSFUL', providerReference: referenceId };
    }

    try {
      await this.ensureToken();
      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          'X-Target-Environment': this.environment,
          Authorization: `Bearer ${this.token}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const status = data.status === 'SUCCESSFUL' ? 'SUCCESSFUL'
          : data.status === 'FAILED' ? 'FAILED' : 'PENDING';
        return { success: status === 'SUCCESSFUL', status, providerReference: referenceId };
      }

      return { success: false, status: 'FAILED', message: 'Status check failed' };
    } catch (err: any) {
      this.logger.error(`❌ MTN MoMo status check error: ${err.message}`);
      return { success: false, status: 'FAILED', message: err.message };
    }
  }

  private async ensureToken(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return;

    const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    } else {
      throw new Error(`MTN MoMo auth failed: ${response.status}`);
    }
  }
}
