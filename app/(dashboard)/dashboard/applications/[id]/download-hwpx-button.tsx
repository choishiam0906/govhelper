'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateHwpx, downloadHwpx, HwpxDocument } from '@/lib/hwpx/generator'

interface ApplicationSection {
  section: string
  content: string
}

interface ApplicationContent {
  sections: ApplicationSection[]
  metadata?: {
    announcementId: string
    announcementTitle: string
    generatedAt: string
  }
}

interface DownloadHwpxButtonProps {
  application: {
    id: string
    content: string
    status: string
    created_at: string
    updated_at: string
    matches: {
      id: string
      match_score: number
      announcements: {
        title: string
        organization: string | null
        category: string | null
        support_type: string | null
        support_amount: string | null
        application_end: string | null
      }
    }
  }
}

export function DownloadHwpxButton({ application }: DownloadHwpxButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const content: ApplicationContent = application.content
    ? JSON.parse(application.content)
    : { sections: [] }

  const announcement = application.matches?.announcements

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      // HWPX 문서 데이터 준비
      const hwpxDoc: HwpxDocument = {
        title: `지원서: ${announcement?.title || '문서'}`,
        organization: announcement?.organization || undefined,
        sections: content.sections.map(s => ({
          title: s.section,
          content: s.content,
        })),
        metadata: {
          author: 'GovHelper',
          createdAt: application.created_at,
          matchScore: application.matches?.match_score,
          category: announcement?.category || undefined,
          supportType: announcement?.support_type || undefined,
          supportAmount: announcement?.support_amount || undefined,
          applicationEnd: announcement?.application_end || undefined,
        },
      }

      // HWPX 생성
      const blob = await generateHwpx(hwpxDoc)

      // 파일명 생성
      const fileName = `지원서_${announcement?.title?.slice(0, 20) || '문서'}_${new Date().toISOString().split('T')[0]}`

      // 다운로드
      downloadHwpx(blob, fileName)

      toast.success('HWP 파일을 다운로드했어요')
    } catch (error) {
      console.error('HWPX 생성 오류:', error)
      toast.error('HWP 파일 생성 중 오류가 발생했어요')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          생성 중...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          HWP 다운로드
        </>
      )}
    </Button>
  )
}
