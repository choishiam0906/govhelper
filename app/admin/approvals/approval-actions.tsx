'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, FileText, Loader2, ExternalLink } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ApprovalActionsProps {
  companyId: string
  currentStatus: string
  businessPlanUrl: string | null
}

export function ApprovalActions({ companyId, currentStatus, businessPlanUrl }: ApprovalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleApproval = async (status: 'approved' | 'rejected') => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(status === 'approved' ? '승인되었습니다' : '거절되었습니다')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '처리 중 오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      {businessPlanUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={businessPlanUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="w-4 h-4 mr-1" />
            사업계획서
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      )}

      {currentStatus === 'pending' && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                승인
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>승인하시겠어요?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 사업자를 승인하면 서비스를 이용할 수 있게 됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleApproval('approved')}>
                  승인
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                거절
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>거절하시겠어요?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 사업자의 승인 요청을 거절합니다. 거절된 사업자는 서비스를 이용할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleApproval('rejected')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  거절
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {currentStatus === 'rejected' && (
        <Button size="sm" variant="outline" onClick={() => handleApproval('approved')} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1" />
          )}
          재승인
        </Button>
      )}

      {currentStatus === 'approved' && (
        <Button size="sm" variant="destructive" onClick={() => handleApproval('rejected')} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-1" />
          )}
          승인 취소
        </Button>
      )}
    </div>
  )
}
