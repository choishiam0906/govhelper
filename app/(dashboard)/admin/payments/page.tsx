'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, CheckCircle, RefreshCw, Shield } from 'lucide-react'

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
    orderName?: string
    depositorName?: string
  }
  created_at: string
  updated_at: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/payments?status=${statusFilter}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setPayments(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 목록을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const handleConfirmClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setConfirmDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return

    setConfirmingId(selectedPayment.id)

    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}/confirm`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      alert('입금 확인 완료! 구독이 활성화되었습니다.')
      fetchPayments()
    } catch (err) {
      alert(err instanceof Error ? err.message : '입금 확인에 실패했습니다')
    } finally {
      setConfirmingId(null)
      setConfirmDialogOpen(false)
      setSelectedPayment(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">결제완료</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">입금대기</Badge>
      case 'failed':
        return <Badge variant="destructive">실패</Badge>
      case 'cancelled':
        return <Badge variant="outline">취소</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanName = (plan?: string) => {
    switch (plan) {
      case 'proMonthly':
        return 'Pro 월간'
      case 'proYearly':
        return 'Pro 연간'
      default:
        return plan || '-'
    }
  }

  if (error === '관리자 권한이 필요합니다') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">접근 권한 없음</h1>
        <p className="text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            입금 확인 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            무통장 입금 결제를 확인하고 구독을 활성화합니다
          </p>
        </div>
        <Button variant="outline" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>결제 목록</CardTitle>
              <CardDescription>
                입금대기 상태의 결제를 확인하고 승인하세요
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">입금대기</SelectItem>
                <SelectItem value="completed">결제완료</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === 'pending'
                ? '대기 중인 입금이 없습니다'
                : '결제 내역이 없습니다'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead>입금자명</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>신청일시</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.order_id?.slice(-12) || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.metadata?.orderName || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPlanName(payment.metadata?.plan)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {payment.metadata?.depositorName || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payment.amount)}원
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmClick(payment)}
                          disabled={confirmingId === payment.id}
                        >
                          {confirmingId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              입금확인
                            </>
                          )}
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <span className="text-sm text-green-600">처리완료</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 입금 확인 다이얼로그 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입금 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>다음 결제의 입금을 확인하시겠습니까?</p>
                {selectedPayment && (
                  <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">상품</span>
                      <span className="font-medium">{selectedPayment.metadata?.orderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">입금자명</span>
                      <span className="font-medium">{selectedPayment.metadata?.depositorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">금액</span>
                      <span className="font-bold">{formatPrice(selectedPayment.amount)}원</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-amber-600">
                  입금 확인 시 해당 사용자의 Pro 구독이 즉시 활성화됩니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!confirmingId}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={!!confirmingId}
            >
              {confirmingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '입금 확인'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
