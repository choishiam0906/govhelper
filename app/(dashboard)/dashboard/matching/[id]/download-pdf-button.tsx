'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { MatchAnalysis } from '@/types'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface DownloadPDFButtonProps {
  match: {
    id: string
    match_score: number
    analysis: MatchAnalysis
    created_at: string
  }
  announcement: {
    title: string
    organization: string
    category: string | null
    support_type: string | null
    support_amount: string | null
    application_end: string | null
  } | null
}

export function DownloadPDFButton({ match, announcement }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const analysis = match.analysis
  const eligibility = analysis.eligibility

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#2563eb'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

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
      const fileName = `매칭분석_${announcement?.title?.slice(0, 20) || '결과'}_${new Date().toISOString().split('T')[0]}.pdf`
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            {announcement?.title || '삭제된 공고'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {announcement?.organization || '-'} | 분석일: {new Date(match.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 1단계: 자격 조건 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>1단계: 자격 조건 검토</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: eligibility?.isEligible ? '#dcfce7' : '#fee2e2',
              color: eligibility?.isEligible ? '#166534' : '#991b1b',
            }}>
              {eligibility?.isEligible ? '지원 가능' : '지원 불가'}
            </span>
          </div>

          {eligibility?.checks && Object.entries(eligibility.checks).map(([key, check]) => {
            const labels: Record<string, string> = {
              industry: '업종 조건',
              region: '지역 조건',
              companyAge: '업력 조건',
              revenue: '매출 조건',
              employeeCount: '직원수 조건',
            }
            return (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '16px', color: check.passed ? '#22c55e' : '#ef4444' }}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    {labels[key]} - {check.passed ? '충족' : '미충족'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    요구조건: {check.requirement} | 기업현황: {check.companyValue}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 2단계: 적합도 점수 */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            2단계: 적합도 점수
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            {/* 종합 점수 */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              border: `4px solid ${getScoreColor(eligibility?.isEligible ? analysis.overallScore : 0)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f9ff',
            }}>
              <span style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: getScoreColor(eligibility?.isEligible ? analysis.overallScore : 0),
              }}>
                {eligibility?.isEligible ? analysis.overallScore : 0}
              </span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>종합점수</span>
            </div>

            {/* 세부 점수 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
              {[
                { label: '기술성', score: analysis.technicalScore || 0, max: 25 },
                { label: '시장성', score: analysis.marketScore || 0, max: 20 },
                { label: '사업성', score: analysis.businessScore || 0, max: 20 },
                { label: '공고부합도', score: analysis.fitScore || 0, max: 25 },
                { label: '가점', score: analysis.bonusPoints || 0, max: 10 },
              ].map((item) => (
                <div key={item.label} style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  minWidth: '80px',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{item.score}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.label}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>/{item.max}점</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 분석 상세 */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          {/* 강점 */}
          <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '12px' }}>강점</h3>
            {analysis.strengths?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#111827', marginBottom: '6px' }}>• {item}</div>
            ))}
          </div>

          {/* 보완점 */}
          <div style={{ flex: 1, backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>보완점</h3>
            {analysis.weaknesses?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#111827', marginBottom: '6px' }}>• {item}</div>
            ))}
          </div>

          {/* 추천사항 */}
          <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '12px' }}>추천사항</h3>
            {analysis.recommendations?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#111827', marginBottom: '6px' }}>• {item}</div>
            ))}
          </div>
        </div>

        {/* 공고 정보 */}
        {announcement && (
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>공고 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>분류</div>
                <div style={{ fontSize: '14px', color: '#111827' }}>{announcement.category || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>지원유형</div>
                <div style={{ fontSize: '14px', color: '#111827' }}>{announcement.support_type || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>지원금액</div>
                <div style={{ fontSize: '14px', color: '#111827' }}>{announcement.support_amount || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>접수마감</div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {announcement.application_end
                    ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>
            정부지원사업도우미 | govhelpers.com | {new Date().toLocaleDateString('ko-KR')} 생성
          </p>
        </div>
      </div>
    </>
  )
}
