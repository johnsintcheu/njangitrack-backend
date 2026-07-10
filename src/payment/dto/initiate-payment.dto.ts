export class InitiatePaymentDto {
  contributionId: string
  amount: number
  currency?: string
  payerPhone: string
  paymentMethod: 'MTN_MOMO' | 'ORANGE_MONEY'
}
