'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileText, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import type { Announcement } from './types'

interface AttachmentsTabProps {
  announcement: Announcement
  onAttachmentsUpdated: (urls: string[]) => void
}

/**
 * 첨부파일 탭 컴포넌트
 * - 첨부파일 목록 표시
 * - 외부 공고 사이트에서 첨부파일 스크래핑 기능
 */
export function AttachmentsTab({ announcement, onAttachmentsUpdated }: AttachmentsTabProps) {
  const [fetchingAttachments, setFetchingAttachments] = useState(false)

  const fetchAttachments = async () => {
    setFetchingAttachments(true)
    try {
      const response = await fetch(`/api/announcements/scrape-attachments?id=${announcement.id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      onAttachmentsUpdated(result.attachments || [])

      if (result.attachments && result.attachments.length > 0) {
        toast.success(`${result.attachments.length}개의 첨부파일을 찾았어요`)
      } else {
        toast.info('첨부파일이 없어요')
      }
    } catch (error) {
      toast.error('첨부파일을 가져오지 못했어요')
    } finally {
      setFetchingAttachments(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>첨부파일</CardTitle>
            <CardDescription>공고와 관련된 첨부파일이에요</CardDescription>
          </div>
          {(!announcement.attachment_urls || announcement.attachment_urls.length === 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAttachments}
              disabled={fetchingAttachments}
            >
              {fetchingAttachments ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  가져오는 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  첨부파일 가져오기
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {announcement.attachment_urls && announcement.attachment_urls.length > 0 ? (
          <div className="space-y-2">
            {announcement.attachment_urls.map((url, index) => {
              const fileName = url.split('/').pop() || `첨부파일 ${index + 1}`
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex-1 truncate">{decodeURIComponent(fileName)}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">첨부파일이 아직 로드되지 않았어요</p>
            <p className="text-sm text-muted-foreground">
              '첨부파일 가져오기' 버튼을 클릭하여 원본 공고에서 첨부파일을 가져올 수 있어요
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
