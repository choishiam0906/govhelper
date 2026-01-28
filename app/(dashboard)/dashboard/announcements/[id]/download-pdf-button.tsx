'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  content: string | null
  parsed_content: string | null
  source: string
  status: string
  attachment_urls?: string[] | null
}

interface DownloadPDFButtonProps {
  announcement: Announcement
}

function getFileName(url: string, index: number): string {
  try {
    const decoded = decodeURIComponent(url.split('/').pop() || '')
    // URL 파라미터 제거
    const name = decoded.split('?')[0]
    if (name && name.length > 3) return name
  } catch {}
  return `첨부파일 ${index + 1}`
}

export function DownloadPDFButton({ announcement }: DownloadPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<string[]>(
    announcement.attachment_urls || []
  )

  const fetchAttachments = async (): Promise<string[]> => {
    const response = await fetch(
      `/api/announcements/scrape-attachments?id=${announcement.id}`
    )
    const result = await response.json()
    if (result.success && result.attachments?.length > 0) {
      setAttachments(result.attachments)
      return result.attachments
    }
    return []
  }

  const handleClick = async () => {
    // 이미 첨부파일이 있으면 바로 처리
    if (attachments.length > 0) return

    // 없으면 스크래핑 시도
    setIsLoading(true)
    try {
      const urls = await fetchAttachments()
      if (urls.length === 0) {
        toast.info('이 공고에는 첨부파일이 없어요')
      } else {
        toast.success(`${urls.length}개의 첨부파일을 찾았어요`)
      }
    } catch {
      toast.error('첨부파일을 가져오지 못했어요')
    } finally {
      setIsLoading(false)
    }
  }

  const openFile = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        첨부파일 검색 중...
      </Button>
    )
  }

  // 첨부파일이 1개면 바로 다운로드
  if (attachments.length === 1) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => openFile(attachments[0])}
      >
        <Download className="h-4 w-4 mr-2" />
        첨부파일 다운로드
      </Button>
    )
  }

  // 첨부파일이 여러 개면 드롭다운
  if (attachments.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            첨부파일 ({attachments.length}개)
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {attachments.map((url, i) => (
            <DropdownMenuItem key={i} onClick={() => openFile(url)}>
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{getFileName(url, i)}</span>
              <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 첨부파일 없으면 가져오기 버튼
  return (
    <Button variant="outline" className="w-full" onClick={handleClick}>
      <Download className="h-4 w-4 mr-2" />
      첨부파일 다운로드
    </Button>
  )
}
