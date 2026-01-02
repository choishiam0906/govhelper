const TOSS_API_URL = 'https://api.tosspayments.com/v1'

interface TossPaymentResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
}

interface TossError {
  code: string
  message: string
}

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || ''
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  })

  if (!response.ok) {
    const error: TossError = await response.json()
    throw new Error(`Toss payment error: ${error.code} - ${error.message}`)
  }

  return response.json()
}

export async function cancelTossPayment(
  paymentKey: string,
  cancelReason: string
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason,
    }),
  })

  if (!response.ok) {
    const error: TossError = await response.json()
    throw new Error(`Toss cancel error: ${error.code} - ${error.message}`)
  }

  return response.json()
}

export async function issueTossBillingKey(
  customerKey: string,
  authKey: string
): Promise<{ billingKey: string; customerKey: string }> {
  const response = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey,
      authKey,
    }),
  })

  if (!response.ok) {
    const error: TossError = await response.json()
    throw new Error(`Toss billing key error: ${error.code} - ${error.message}`)
  }

  return response.json()
}

export async function chargeTossBilling(
  billingKey: string,
  customerKey: string,
  amount: number,
  orderId: string,
  orderName: string
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
    }),
  })

  if (!response.ok) {
    const error: TossError = await response.json()
    throw new Error(`Toss billing charge error: ${error.code} - ${error.message}`)
  }

  return response.json()
}
