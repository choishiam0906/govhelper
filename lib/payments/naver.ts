const NAVER_PAY_API_URL = 'https://dev.apis.naver.com/naverpay-partner/naverpay/payments/v2.2'

interface NaverPayReserveResponse {
  code: string
  message: string
  body: {
    reserveId: string
  }
}

interface NaverPayApproveResponse {
  code: string
  message: string
  body: {
    paymentId: string
    detail: {
      productAmount: number
      paymentId: string
      merchantId: string
      merchantName: string
      cardCorpCode: string
      cardNo: string
      admissionState: string
      totalPayAmount: number
      primaryPayAmount: number
    }
  }
}

function getHeaders(): Record<string, string> {
  return {
    'X-Naver-Client-Id': process.env.NAVER_PAY_CLIENT_ID || '',
    'X-Naver-Client-Secret': process.env.NAVER_PAY_CLIENT_SECRET || '',
    'Content-Type': 'application/json',
  }
}

export async function reserveNaverPay(
  merchantPayKey: string,
  productName: string,
  totalPayAmount: number,
  returnUrl: string
): Promise<NaverPayReserveResponse> {
  const response = await fetch(`${NAVER_PAY_API_URL}/reserve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      merchantPayKey,
      productName,
      productCount: 1,
      totalPayAmount,
      taxScopeAmount: totalPayAmount,
      taxExScopeAmount: 0,
      returnUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Naver Pay reserve error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function approveNaverPay(
  paymentId: string
): Promise<NaverPayApproveResponse> {
  const response = await fetch(`${NAVER_PAY_API_URL}/apply/payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      paymentId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Naver Pay approve error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function cancelNaverPay(
  paymentId: string,
  cancelAmount: number,
  cancelReason: string
): Promise<void> {
  const response = await fetch(`${NAVER_PAY_API_URL}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      paymentId,
      cancelAmount,
      cancelReason,
      cancelRequester: 1, // 1: merchant
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Naver Pay cancel error: ${JSON.stringify(error)}`)
  }
}
