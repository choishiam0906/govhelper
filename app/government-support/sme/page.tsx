import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Calendar, Building2, Banknote, ArrowRight, Factory } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'

export const metadata: Metadata = {
  title: '중소기업 정부지원사업 2026 | 중소기업 지원금 총정리 - GovHelper',
  description: '2026년 중소기업을 위한 정부지원사업 총정리! 중소기업 지원금, 스마트공장, 수출바우처, 고용지원 등 중소기업 맞춤 지원사업을 AI가 분석해 추천해드려요.',
  keywords: [
    '중소기업 정부지원',
    '중소기업 지원금',
    '스마트공장',
    '수출바우처',
    '고용지원금',
    '중소기업 보조금',
    '제조업 지원',
    '중소벤처기업부',
    '2026 중소기업지원',
  ],
  openGraph: {
    title: '중소기업 정부지원사업 2026 | 중소기업 지원금 총정리',
    description: '2026년 중소기업을 위한 정부지원사업 총정리! 스마트공장, 수출바우처 등 AI 맞춤 추천',
    url: 'https://govhelpers.com/government-support/sme',
    type: 'website',
  },
  alternates: {
    canonical: 'https://govhelpers.com/government-support/sme',
  },
}

// 공고 타입 정의
interface AnnouncementItem {
  id: string
  title: string
  organization: string | null
  support_amount: string | null
  application_end: string | null
  category: string | null
  source: string | null
}

const breadcrumbItems = [
  { name: '홈', url: 'https://govhelpers.com' },
  { name: '정부지원사업', url: 'https://govhelpers.com/government-support' },
  { name: '중소기업', url: 'https://govhelpers.com/government-support/sme' },
]

// 중소기업 관련 키워드
const smeKeywords = ['중소기업', '중소', '제조', '생산', '수출', '스마트공장', '고용']

export default async function SmeSupportPage() {
  const supabase = await createClient()

  // 중소기업 관련 공고 조회
  const { data } = await supabase
    .from('announcements')
    .select('id, title, organization, support_amount, application_end, category, source')
    .eq('status', 'active')
    .or(smeKeywords.map(k => `title.ilike.%${k}%`).join(','))
    .order('application_end', { ascending: true })
    .limit(12)

  const announcements = (data || []) as AnnouncementItem[]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '상시'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }

  const getDday = (dateString: string | null) => {
    if (!dateString) return null
    const end = new Date(dateString)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600">홈</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/government-support" className="hover:text-blue-600">정부지원사업</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 dark:text-gray-100">중소기업</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Factory className="h-4 w-4" />
                <span className="text-sm font-medium">2026년 중소기업 지원사업</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                중소기업 정부지원사업
                <br />
                <span className="text-blue-200">성장을 위한 맞춤 지원금</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
                스마트공장, 수출바우처, 고용지원금 등 중소기업을 위한
                다양한 정부지원사업을 검색하고 AI 매칭으로 적합도를 분석하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/try"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  무료 AI 매칭 받기
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard/announcements?category=sme"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/30 text-white font-semibold rounded-lg hover:bg-blue-500/40 transition-colors border border-blue-400/30"
                >
                  전체 공고 보기
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 border-b py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{announcements?.length || 0}+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">진행중인 공고</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">최대 50억</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">지원금 규모</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">300인 미만</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">직원수 기준</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">30초</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">AI 분석 시간</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* 주요 지원사업 설명 */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              중소기업 주요 정부지원사업
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  스마트공장 지원
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  제조업 중소기업 대상. 스마트공장 구축 비용의 50% 지원.
                  MES, ERP, 자동화 설비 도입 지원.
                </p>
                <span className="text-blue-600 font-medium text-sm">지원금: 최대 1억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  수출바우처
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  수출 희망 중소기업 대상. 해외마케팅, 전시회 참가,
                  인증 취득 등 수출 관련 비용 지원.
                </p>
                <span className="text-green-600 font-medium text-sm">지원금: 최대 1억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Banknote className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  고용안정지원금
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  고용유지, 신규채용 시 인건비 지원.
                  청년고용, 장애인고용 시 추가 지원.
                </p>
                <span className="text-orange-600 font-medium text-sm">지원금: 1인당 월 최대 80만 원</span>
              </div>
            </div>
          </section>

          {/* 현재 진행중인 공고 */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                지금 신청 가능한 중소기업 지원사업
              </h2>
              <Link
                href="/dashboard/announcements?category=sme"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                전체보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements?.map((announcement) => {
                const dday = getDday(announcement.application_end)
                return (
                  <Link
                    key={announcement.id}
                    href={`/dashboard/announcements/${announcement.id}`}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        {announcement.source || announcement.category}
                      </span>
                      {dday !== null && dday <= 14 && (
                        <span className={`text-xs font-bold ${dday <= 7 ? 'text-red-500' : 'text-orange-500'}`}>
                          D-{dday}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {announcement.organization}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(announcement.application_end)}
                      </span>
                      {announcement.support_amount && (
                        <span className="font-medium text-blue-600">
                          {announcement.support_amount}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* 자격 조건 안내 */}
          <section className="mb-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              중소기업 지원 자격 조건
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">중소기업 기준</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    제조업: 평균 매출 1,500억 원 이하 또는 상시근로자 300인 미만
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    서비스업: 평균 매출 600억 원 이하 또는 상시근로자 300인 미만
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    독립성 기준 충족 (대기업 계열 제외)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    이노비즈, 메인비즈 인증 보유 시 가점
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">지원 제외 대상</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    휴/폐업 중인 기업
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    국세/지방세 체납 기업
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    금융기관 불량거래자
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    도박, 사행성 등 불건전 업종
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              우리 중소기업에 맞는 지원사업 찾기
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              사업자번호만 입력하면 30초 만에 AI가 적합한 지원사업을 분석해드려요.
              무료로 체험해보세요!
            </p>
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg"
            >
              무료 AI 매칭 시작하기
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t py-8">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2026 GovHelper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
