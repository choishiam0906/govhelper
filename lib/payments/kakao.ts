const KAKAO_PAY_API_URL = 'https://open-api.kakaopay.com/online/v1/payment'

interface KakaoPayReadyResponse {
  tid: string
  next_redirect_pc_url: string
  next_redirect_mobile_url: string
  next_redirect_app_url: string
  android_app_scheme: string
  ios_app_scheme: string
  created_at: string
}

interface KakaoPayApproveResponse {
  aid: string
  tid: string
  cid: string
  partner_order_id: string
  partner_user_id: string
  payment_method_type: string
  amount: {
    total: number
    tax_free: number
    vat: number
    point: number
    discount: number
  }
  approved_at: string
}

function getAuthHeader(): string {
  const adminKey = process.env.KAKAO_PAY_ADMIN_KEY || ''
  return `SECRET_KEY ${adminKey}`
}

export async function readyKakaoPay(
  orderId: string,
  userId: string,
  itemName: string,
  quantity: number,
  totalAmount: number,
  approvalUrl: string,
  cancelUrl: string,
  failUrl: string
): Promise<KakaoPayReadyResponse> {
  const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'

  const response = await fetch(`${KAKAO_PAY_API_URL}/ready`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cid,
      partner_order_id: orderId,
      partner_user_id: userId,
      item_name: itemName,
      quantity,
      total_amount: totalAmount,
      tax_free_amount: 0,
      approval_url: approvalUrl,
      cancel_url: cancelUrl,
      fail_url: failUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Kakao Pay ready error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function approveKakaoPay(
  tid: string,
  orderId: string,
  userId: string,
  pgToken: string
): Promise<KakaoPayApproveResponse> {
  const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'

  const response = await fetch(`${KAKAO_PAY_API_URL}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cid,
      tid,
      partner_order_id: orderId,
      partner_user_id: userId,
      pg_token: pgToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Kakao Pay approve error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function cancelKakaoPay(
  tid: string,
  cancelAmount: number,
  cancelTaxFreeAmount: number = 0
): Promise<void> {
  const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'

  const response = await fetch(`${KAKAO_PAY_API_URL}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cid,
      tid,
      cancel_amount: cancelAmount,
      cancel_tax_free_amount: cancelTaxFreeAmount,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Kakao Pay cancel error: ${JSON.stringify(error)}`)
  }
}
