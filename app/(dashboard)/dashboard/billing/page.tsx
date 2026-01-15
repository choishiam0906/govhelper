import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreditCard, Calendar, Crown, AlertTriangle, Building2, Mail } from 'lucide-react'
import { PAYMENT_PRICES } from '@/lib/payments'
import { PricingCard } from '@/components/billing/pricing-card'

// 계좌 정보
const BANK_ACCOUNT = {
  bankName: '신한은행',
  accountNumber: '110-377-265-992',
  accountHolder: '최기헌',
}

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 구독 정보 조회
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const subscription = subscriptionData as {
    id: string
    plan: string
    status: string
    current_period_start: string | null
    current_period_end: string | null
  } | null

  // 결제 내역 조회
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const currentPlan = subscription?.plan || 'free'
  const isActive = subscription?.status === 'active'
  const isCancelled = subscription?.status === 'cancelled'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null

  const daysRemaining = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">결제완료</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">입금대기</Badge>
      case 'failed':
        return <Badge variant="destructive">실패</Badge>
      case 'cancelled':
        return <Badge variant="outline">취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">결제 및 구독</h1>
        <p className="text-muted-foreground mt-1">
          요금제와 결제 정보를 확인하고 관리해요
        </p>
      </div>

      {/* 현재 구독 상태 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={currentPlan === 'pro' ? 'h-5 w-5 text-primary' : 'h-5 w-5 text-muted-foreground'} />
              <CardTitle>현재 플랜</CardTitle>
            </div>
            <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'}>
              {currentPlan === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentPlan === 'free' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                무료 플랜을 사용 중이에요. Pro로 업그레이드하면 무제한 AI 매칭과 지원서 작성 기능을 이용할 수 있어요.
              </p>
              <Button asChild>
                <Link href="/dashboard/billing/checkout">
                  Pro로 업그레이드
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">구독 시작일</p>
                    <p className="font-medium">
                      {subscription?.current_period_start
                        ? formatDate(subscription.current_period_start)
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">다음 결제일</p>
                    <p className="font-medium">
                      {periodEnd ? formatDate(periodEnd.toISOString()) : '-'}
                      {daysRemaining !== null && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({daysRemaining}일 남음)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {isCancelled && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">
                    구독이 취소되었습니다. {periodEnd ? formatDate(periodEnd.toISOString()) : ''}까지 Pro 기능을 이용할 수 있습니다.
                  </p>
                </div>
              )}

              {isActive && !isCancelled && (
                <Button variant="outline" asChild>
                  <Link href="/dashboard/billing/checkout?cancel=true">
                    구독 취소
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 요금제 비교 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">요금제</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <PricingCard
            name="Free"
            description="시작하기 좋은 무료 플랜"
            price={0}
            period="monthly"
            features={[
              'AI 매칭 분석 월 3회',
              '공고 검색 무제한',
              '관심 공고 저장',
            ]}
            current={currentPlan === 'free'}
          />
          <PricingCard
            name="Pro 월간"
            description="더 많은 기능이 필요할 때"
            price={PAYMENT_PRICES.proMonthly}
            period="monthly"
            features={[
              'AI 매칭 분석 무제한',
              'AI 지원서 작성',
              '우선 고객 지원',
              '매칭 결과 상세 분석',
            ]}
            popular
            current={currentPlan === 'pro'}
            
          />
          <PricingCard
            name="Pro 연간"
            description="2개월 무료로 절약하세요"
            price={PAYMENT_PRICES.proYearly}
            period="yearly"
            features={[
              'Pro 월간의 모든 기능',
              '연간 결제 시 17% 할인',
              '2개월 무료',
            ]}
            current={currentPlan === 'pro'}
            
          />
        </div>
      </div>

      {/* 무통장 입금 안내 */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>무통장 입금 안내</CardTitle>
          </div>
          <CardDescription>계좌이체로 안전하게 결제하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 계좌 정보 */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">은행</span>
                <span className="font-medium">{BANK_ACCOUNT.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">계좌번호</span>
                <span className="font-mono font-bold text-lg">{BANK_ACCOUNT.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">예금주</span>
                <span className="font-medium">{BANK_ACCOUNT.accountHolder}</span>
              </div>
            </div>
          </div>

          {/* 입금 후 안내 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">입금 완료 후 메일을 보내주세요!</p>
                <p className="mb-2">
                  입금 확인을 빠르게 처리하기 위해 아래 이메일로 연락 부탁드립니다.
                </p>
                <p className="font-medium">
                  📧 <a href="mailto:choishiam@gmail.com" className="underline">choishiam@gmail.com</a>
                </p>
                <ul className="mt-2 space-y-1 text-amber-700">
                  <li>• 입금자명</li>
                  <li>• 입금 금액</li>
                  <li>• 선택하신 요금제 (월간/연간)</li>
                </ul>
              </div>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href="/dashboard/billing/checkout">
              Pro 구독 신청하기
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 결제 내역 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>결제 내역</CardTitle>
          </div>
          <CardDescription>최근 결제 내역입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              아직 결제 내역이 없어요
            </p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {payment.metadata?.orderName || 'GovHelper 결제'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.created_at)}
                      {payment.payment_method === 'bank_transfer' && payment.metadata?.depositorName && (
                        <span className="ml-2">
                          (입금자: {payment.metadata.depositorName})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">{formatPrice(payment.amount)}원</p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
