export class MtnMoMoWebhookDto {
  referenceId?: string
  status?: string
  reason?: string
  [key: string]: any
}

export class OrangeMoneyWebhookDto {
  paymentId?: string
  status?: string
  externalId?: string
  [key: string]: any
}
