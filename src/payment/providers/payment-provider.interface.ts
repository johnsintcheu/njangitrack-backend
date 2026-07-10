export interface PaymentRequest {
  amount: string
  currency: string
  payerPhone: string
  payerMessage?: string
  payeeNote?: string
  externalId: string
}

export interface PaymentResult {
  success: boolean
  providerReference?: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  message?: string
}

export interface PaymentProvider {
  readonly name: string
  requestToPay(request: PaymentRequest): Promise<PaymentResult>
  checkPaymentStatus(referenceId: string): Promise<PaymentResult>
}
