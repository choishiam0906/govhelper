'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { MatchAnalysis } from '@/types'

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

  const analysis = match.analysis
  const eligibility = analysis.eligibility

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#2563eb'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      const eligibilityLabels: Record<string, string> = {
        industry: '업종 조건',
        region: '지역 조건',
        companyAge: '업력 조건',
        revenue: '매출 조건',
        employeeCount: '직원수 조건',
      }

      // HTML 문자열 생성
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>매칭 분석 - ${announcement?.title || '결과'}</title>
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
            h1 {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin: 8px 0;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
            }
            h2 {
              font-size: 18px;
              font-weight: bold;
              color: #111827;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .badge-eligible {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-ineligible {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .check-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 12px;
              background-color: #f9fafb;
              border-radius: 8px;
              margin-bottom: 8px;
            }
            .check-icon {
              font-size: 16px;
            }
            .check-icon-pass {
              color: #22c55e;
            }
            .check-icon-fail {
              color: #ef4444;
            }
            .check-content {
              flex: 1;
            }
            .check-title {
              font-size: 14px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 4px;
            }
            .check-detail {
              font-size: 12px;
              color: #6b7280;
            }
            .score-grid {
              display: flex;
              align-items: center;
              gap: 30px;
              margin-bottom: 20px;
            }
            .score-circle {
              width: 120px;
              height: 120px;
              border-radius: 60px;
              border: 4px solid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #f0f9ff;
            }
            .score-value {
              font-size: 32px;
              font-weight: bold;
            }
            .score-label {
              font-size: 10px;
              color: #6b7280;
            }
            .score-details {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              flex: 1;
            }
            .score-item {
              background-color: #f9fafb;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              min-width: 80px;
            }
            .score-item-value {
              font-size: 18px;
              font-weight: bold;
              color: #111827;
            }
            .score-item-label {
              font-size: 11px;
              color: #6b7280;
            }
            .score-item-max {
              font-size: 10px;
              color: #9ca3af;
            }
            .analysis-grid {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
            }
            .analysis-box {
              flex: 1;
              padding: 16px;
              border-radius: 8px;
              border-left: 4px solid;
            }
            .analysis-box-strengths {
              background-color: #f0fdf4;
              border-left-color: #22c55e;
            }
            .analysis-box-weaknesses {
              background-color: #fffbeb;
              border-left-color: #f59e0b;
            }
            .analysis-box-recommendations {
              background-color: #eff6ff;
              border-left-color: #2563eb;
            }
            .analysis-box h3 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            .analysis-box-strengths h3 {
              color: #166534;
            }
            .analysis-box-weaknesses h3 {
              color: #92400e;
            }
            .analysis-box-recommendations h3 {
              color: #1d4ed8;
            }
            .analysis-item {
              font-size: 12px;
              color: #111827;
              margin-bottom: 6px;
            }
            .info-grid {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .info-grid h3 {
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 16px;
            }
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              color: #111827;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${announcement?.title || '삭제된 공고'}</h1>
            <p class="subtitle">${announcement?.organization || '-'} | 분석일: ${new Date(match.created_at).toLocaleDateString('ko-KR')}</p>
          </div>

          <!-- 1단계: 자격 조건 -->
          <div class="section">
            <div class="section-header">
              <h2>1단계: 자격 조건 검토</h2>
              <span class="badge ${eligibility?.isEligible ? 'badge-eligible' : 'badge-ineligible'}">
                ${eligibility?.isEligible ? '지원 가능' : '지원 불가'}
              </span>
            </div>

            ${eligibility?.checks ? Object.entries(eligibility.checks).map(([key, check]: [string, any]) => `
              <div class="check-item">
                <span class="check-icon ${check.passed ? 'check-icon-pass' : 'check-icon-fail'}">
                  ${check.passed ? '✓' : '✗'}
                </span>
                <div class="check-content">
                  <div class="check-title">${eligibilityLabels[key]} - ${check.passed ? '충족' : '미충족'}</div>
                  <div class="check-detail">요구조건: ${check.requirement} | 기업현황: ${check.companyValue}</div>
                </div>
              </div>
            `).join('') : ''}
          </div>

          <!-- 2단계: 적합도 점수 -->
          <div class="section">
            <h2>2단계: 적합도 점수</h2>
            <div class="score-grid">
              <div class="score-circle" style="border-color: ${getScoreColor(eligibility?.isEligible ? analysis.overallScore : 0)}">
                <span class="score-value" style="color: ${getScoreColor(eligibility?.isEligible ? analysis.overallScore : 0)}">
                  ${eligibility?.isEligible ? analysis.overallScore : 0}
                </span>
                <span class="score-label">종합점수</span>
              </div>

              <div class="score-details">
                <div class="score-item">
                  <div class="score-item-value">${analysis.technicalScore || 0}</div>
                  <div class="score-item-label">기술성</div>
                  <div class="score-item-max">/25점</div>
                </div>
                <div class="score-item">
                  <div class="score-item-value">${analysis.marketScore || 0}</div>
                  <div class="score-item-label">시장성</div>
                  <div class="score-item-max">/20점</div>
                </div>
                <div class="score-item">
                  <div class="score-item-value">${analysis.businessScore || 0}</div>
                  <div class="score-item-label">사업성</div>
                  <div class="score-item-max">/20점</div>
                </div>
                <div class="score-item">
                  <div class="score-item-value">${analysis.fitScore || 0}</div>
                  <div class="score-item-label">공고부합도</div>
                  <div class="score-item-max">/25점</div>
                </div>
                <div class="score-item">
                  <div class="score-item-value">${analysis.bonusPoints || 0}</div>
                  <div class="score-item-label">가점</div>
                  <div class="score-item-max">/10점</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 분석 상세 -->
          <div class="analysis-grid">
            <div class="analysis-box analysis-box-strengths">
              <h3>강점</h3>
              ${analysis.strengths?.map((item: string) => `<div class="analysis-item">• ${item}</div>`).join('') || ''}
            </div>
            <div class="analysis-box analysis-box-weaknesses">
              <h3>보완점</h3>
              ${analysis.weaknesses?.map((item: string) => `<div class="analysis-item">• ${item}</div>`).join('') || ''}
            </div>
            <div class="analysis-box analysis-box-recommendations">
              <h3>추천사항</h3>
              ${analysis.recommendations?.map((item: string) => `<div class="analysis-item">• ${item}</div>`).join('') || ''}
            </div>
          </div>

          ${announcement ? `
          <!-- 공고 정보 -->
          <div class="info-grid">
            <h3>공고 정보</h3>
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">분류</div>
                <div class="info-value">${announcement.category || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">지원유형</div>
                <div class="info-value">${announcement.support_type || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">지원금액</div>
                <div class="info-value">${announcement.support_amount || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">접수마감</div>
                <div class="info-value">${
                  announcement.application_end
                    ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
                    : '-'
                }</div>
              </div>
            </div>
          </div>
          ` : ''}

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
