"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Banknote,
  TrendingUp
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface Payment {
  id: string
  user_id: string
  user_email: string
  amount: number
  payment_method: string
  order_id: string
  status: string
  metadata: {
    plan?: string
    depositorName?: string
    confirmedBy?: string
    confirmedAt?: string
  }
  created_at: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  const fetchPayments = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/payments?status=${status}`)
      const result = await response.json()

      if (result.success) {
        setPayments(result.data || [])
      } else {
        toast.error(result.error || "결제 목록을 불러오지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments(activeTab)
  }, [activeTab])

  const handleConfirm = async (paymentId: string) => {
    setConfirming(paymentId)
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast.success("입금 확인 완료! 구독이 활성화됐어요")
        fetchPayments(activeTab)
      } else {
        toast.error(result.error || "처리하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setConfirming(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />입금 대기</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />실패</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "무통장 입금"
      case "toss":
        return "토스페이먼츠"
      case "kakao":
        return "카카오페이"
      case "naver":
        return "네이버페이"
      default:
        return method
    }
  }

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case "proMonthly":
        return "Pro 월간"
      case "proYearly":
        return "Pro 연간"
      default:
        return plan || "-"
    }
  }

  const pendingCount = payments.filter(p => p.status === "pending").length
  const completedPayments = payments.filter(p => p.status === "completed")
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <p className="text-muted-foreground">무통장 입금 확인 및 구독 권한을 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">입금 대기</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTab === "pending" ? payments.length : "-"}건</div>
            <p className="text-xs text-muted-foreground">확인이 필요한 결제</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 완료</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTab === "completed" ? payments.length : "-"}건</div>
            <p className="text-xs text-muted-foreground">처리 완료된 결제</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "completed"
                ? `₩${totalRevenue.toLocaleString()}`
                : "-"
              }
            </div>
            <p className="text-xs text-muted-foreground">완료된 결제 합계</p>
          </CardContent>
        </Card>
      </div>

      {/* 결제 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>결제 내역</CardTitle>
              <CardDescription>입금 대기 중인 결제를 확인하고 구독을 활성화하세요</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchPayments(activeTab)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                입금 대기
              </TabsTrigger>
              <TabsTrigger value="completed">
                완료
              </TabsTrigger>
              <TabsTrigger value="all">
                전체
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>결제 내역이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ₩{payment.amount.toLocaleString()}
                            </span>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-x-2">
                            <span>{getMethodLabel(payment.payment_method)}</span>
                            <span>•</span>
                            <span>{getPlanLabel(payment.metadata?.plan)}</span>
                            {payment.metadata?.depositorName && (
                              <>
                                <span>•</span>
                                <span>입금자: {payment.metadata.depositorName}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>주문번호: {payment.order_id}</span>
                            <span className="mx-2">•</span>
                            <span>
                              {format(new Date(payment.created_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(payment.id)}
                            disabled={confirming === payment.id}
                          >
                            {confirming === payment.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            입금 확인
                          </Button>
                        )}
                        {payment.status === "completed" && payment.metadata?.confirmedAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(payment.metadata.confirmedAt), "M/d HH:mm", { locale: ko })} 확인됨
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 입금 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">무통장 입금 계좌</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">신한은행 110-377-265-992</p>
            <p className="text-sm text-muted-foreground">예금주: (주)거브헬퍼</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
