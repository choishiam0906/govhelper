'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// html2canvas와 jspdf를 동적으로 로드하여 번들 크기 감소
const loadPDFLibraries = async () => {
  const [html2canvas, jsPDF] = await Promise.all([
    import('html2canvas').then(mod => mod.default),
    import('jspdf').then(mod => mod.jsPDF)
  ])
  return { html2canvas, jsPDF }
}

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
}

interface DownloadPDFButtonProps {
  announcement: Announcement
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  datagoKr: '공공데이터',
  g2b: '나라장터',
  hrd: 'HRD Korea',
  smes24: '중소벤처24',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// HTML 태그 제거
function stripHtml(html: string | null): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export function DownloadPDFButton({ announcement }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!contentRef.current) return

    setIsGenerating(true)

    try {
      // 라이브러리를 동적으로 로드
      const { html2canvas, jsPDF } = await loadPDFLibraries()

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
      const fileName = `공고_${announcement.title.slice(0, 30)}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      toast.error('PDF 생성 중 오류가 발생했어요')
    } finally {
      setIsGenerating(false)
    }
  }

  const content = stripHtml(announcement.parsed_content || announcement.content)

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
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
              backgroundColor: '#2563eb',
              color: '#fff',
            }}>
              {sourceLabels[announcement.source] || announcement.source}
            </span>
            {announcement.category && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
              }}>
                {announcement.category}
              </span>
            )}
            {announcement.support_type && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
              }}>
                {announcement.support_type}
              </span>
            )}
            {announcement.status === 'closed' && (
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
              }}>
                마감
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            {announcement.title}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {announcement.organization || '-'}
          </p>
        </div>

        {/* 기본 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px',
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>접수 기간</div>
            <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
              {formatDate(announcement.application_start)} ~ {formatDate(announcement.application_end)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>지원금액</div>
            <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
              {announcement.support_amount || '-'}
            </div>
          </div>
          {announcement.target_company && (
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>지원 대상</div>
              <div style={{ fontSize: '14px', color: '#111827' }}>
                {announcement.target_company}
              </div>
            </div>
          )}
        </div>

        {/* 공고 내용 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            공고 내용
          </h2>
          <div style={{
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap',
          }}>
            {content || '상세 내용이 없습니다'}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
            GovHelper | govhelpers.com | {new Date().toLocaleDateString('ko-KR')} 생성
          </p>
        </div>
      </div>
    </>
  )
}
