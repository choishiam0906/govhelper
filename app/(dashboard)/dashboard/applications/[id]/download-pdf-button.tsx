'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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
  const contentRef = useRef<HTMLDivElement>(null)

  const content: ApplicationContent = application.content
    ? JSON.parse(application.content)
    : { sections: [] }

  const announcement = application.matches?.announcements

  const handleDownload = async () => {
    if (!contentRef.current) return

    setIsGenerating(true)

    try {
      // 숨겨진 콘텐츠를 일시적으로 표시
      contentRef.current.style.display = 'block'
      contentRef.current.style.position = 'absolute'
      contentRef.current.style.left = '-9999px'
      contentRef.current.style.top = '0'

      // 캔버스로 변환
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // 다시 숨김
      contentRef.current.style.display = 'none'

      // PDF 생성
      const imgWidth = 210 // A4 너비 (mm)
      const pageHeight = 297 // A4 높이 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // 여러 페이지 처리
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // 파일 저장
      const fileName = `지원서_${announcement?.title?.slice(0, 20) || '문서'}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      alert('PDF 생성 중 오류가 발생했어요')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
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

      {/* PDF용 숨겨진 콘텐츠 */}
      <div ref={contentRef} style={{ display: 'none', width: '800px', padding: '40px', backgroundColor: '#fff' }}>
        {/* 헤더 */}
        <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: application.status === 'completed' ? '#2563eb' : '#6b7280',
              color: '#fff',
            }}>
              {application.status === 'completed' ? '작성 완료' : '작성 중'}
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#f0fdf4',
              color: '#166534',
            }}>
              매칭점수: {application.matches?.match_score}점
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            지원서
          </h1>
          <p style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>
            {announcement?.title || '삭제된 공고'}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {announcement?.organization || '-'}
          </p>
        </div>

        {/* 공고 정보 요약 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '30px',
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>분류</div>
            <div style={{ fontSize: '13px', color: '#111827' }}>{announcement?.category || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>지원유형</div>
            <div style={{ fontSize: '13px', color: '#111827' }}>{announcement?.support_type || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>지원금액</div>
            <div style={{ fontSize: '13px', color: '#111827' }}>{announcement?.support_amount || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>접수마감</div>
            <div style={{ fontSize: '13px', color: '#111827' }}>
              {announcement?.application_end
                ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
                : '-'}
            </div>
          </div>
        </div>

        {/* 지원서 섹션들 */}
        {content.sections.map((section, index) => (
          <div key={index} style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e5e7eb',
            }}>
              {section.section}
            </h2>
            <div style={{
              fontSize: '13px',
              color: '#374151',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
            }}>
              {section.content}
            </div>
          </div>
        ))}

        {/* 푸터 */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
            정부지원사업도우미 | govhelpers.com | {new Date().toLocaleDateString('ko-KR')} 생성
          </p>
        </div>
      </div>
    </>
  )
}
