'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

interface DownloadPDFButtonProps {
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

export function DownloadPDFButton({ application }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const content: ApplicationContent = application.content
    ? JSON.parse(application.content)
    : { sections: [] }

  const announcement = application.matches?.announcements

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      // HTML 문자열 생성
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>지원서 - ${announcement?.title || '문서'}</title>
          <style>
            @page { margin: 20mm; }
            body {
              font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
              font-size: 13px;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .header {
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 12px;
              margin-right: 8px;
              margin-bottom: 8px;
            }
            .badge-status {
              background-color: ${application.status === 'completed' ? '#2563eb' : '#6b7280'};
              color: #fff;
            }
            .badge-score {
              background-color: #f0fdf4;
              color: #166534;
            }
            h1 {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin: 8px 0;
            }
            .subtitle {
              font-size: 16px;
              color: #374151;
              margin: 8px 0;
            }
            .organization {
              font-size: 14px;
              color: #6b7280;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 16px;
              margin-bottom: 30px;
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 13px;
              color: #111827;
            }
            .section {
              margin-bottom: 24px;
            }
            .section h2 {
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            .section-content {
              font-size: 13px;
              color: #374151;
              line-height: 1.8;
              white-space: pre-wrap;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="badge badge-status">${application.status === 'completed' ? '작성 완료' : '작성 중'}</span>
              <span class="badge badge-score">매칭점수: ${application.matches?.match_score}점</span>
            </div>
            <h1>지원서</h1>
            <p class="subtitle">${announcement?.title || '삭제된 공고'}</p>
            <p class="organization">${announcement?.organization || '-'}</p>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">분류</div>
              <div class="info-value">${announcement?.category || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">지원유형</div>
              <div class="info-value">${announcement?.support_type || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">지원금액</div>
              <div class="info-value">${announcement?.support_amount || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">접수마감</div>
              <div class="info-value">${
                announcement?.application_end
                  ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
                  : '-'
              }</div>
            </div>
          </div>

          ${content.sections.map((section) => `
            <div class="section">
              <h2>${section.section}</h2>
              <div class="section-content">${section.content}</div>
            </div>
          `).join('')}

          <div class="footer">
            <p>GovHelper | govhelpers.com | ${new Date().toLocaleDateString('ko-KR')} 생성</p>
          </div>
        </body>
        </html>
      `

      // iframe 생성하여 인쇄
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(htmlContent)
        iframeDoc.close()

        // 인쇄 준비 대기
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.print()
            } catch (e) {
              console.error('인쇄 오류:', e)
            }
            setTimeout(() => {
              try {
                document.body.removeChild(iframe)
              } catch (e) {
                console.error('iframe 제거 오류:', e)
              }
            }, 1000)
          }, 500)
        }

        // onload가 이미 발생한 경우 대비
        setTimeout(() => {
          try {
            iframe.contentWindow?.print()
          } catch (e) {
            console.error('인쇄 오류:', e)
          }
          setTimeout(() => {
            try {
              document.body.removeChild(iframe)
            } catch (e) {
              console.error('iframe 제거 오류:', e)
            }
          }, 1000)
        }, 500)
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      toast.error('PDF 생성 중 오류가 발생했어요')
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
          <Download className="h-4 w-4 mr-2" />
          PDF 다운로드
        </>
      )}
    </Button>
  )
}
