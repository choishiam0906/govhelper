import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Calendar, Building2, Banknote, ArrowRight, Sparkles } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'

export const metadata: Metadata = {
  title: '스타트업 정부지원사업 2026 | 창업 지원금 총정리 - GovHelper',
  description: '2026년 스타트업을 위한 정부지원사업을 한눈에! 창업 지원금, 초기창업패키지, 예비창업패키지, 팁스(TIPS) 등 스타트업 맞춤 지원사업을 AI가 분석해 추천해드려요.',
  keywords: [
    '스타트업 정부지원',
    '창업 지원금',
    '초기창업패키지',
    '예비창업패키지',
    'TIPS 지원',
    '창업 지원사업',
    '스타트업 보조금',
    '벤처 지원',
    '2026 창업지원',
  ],
  openGraph: {
    title: '스타트업 정부지원사업 2026 | 창업 지원금 총정리',
    description: '2026년 스타트업을 위한 정부지원사업을 한눈에! 창업 지원금, 초기창업패키지 등 AI 맞춤 추천',
    url: 'https://govhelpers.com/government-support/startup',
    type: 'website',
  },
  alternates: {
    canonical: 'https://govhelpers.com/government-support/startup',
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
  { name: '스타트업', url: 'https://govhelpers.com/government-support/startup' },
]

// 스타트업 관련 키워드
const startupKeywords = ['창업', '스타트업', '벤처', '초기', '예비창업', 'TIPS', '액셀러레이터']

export default async function StartupSupportPage() {
  const supabase = await createClient()

  // 스타트업 관련 공고 조회
  const { data } = await supabase
    .from('announcements')
    .select('id, title, organization, support_amount, application_end, category, source')
    .eq('status', 'active')
    .or(startupKeywords.map(k => `title.ilike.%${k}%`).join(','))
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
              <span className="text-gray-900 dark:text-gray-100">스타트업</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">2026년 스타트업 지원사업</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                스타트업 정부지원사업
                <br />
                <span className="text-purple-200">AI가 찾아주는 맞춤 지원금</span>
              </h1>
              <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-2xl">
                초기창업패키지, 예비창업패키지, TIPS 등 스타트업을 위한
                정부지원사업을 한눈에 검색하고 AI 매칭으로 적합도를 분석하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/try"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                >
                  무료 AI 매칭 받기
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard/announcements?category=startup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/30 text-white font-semibold rounded-lg hover:bg-purple-500/40 transition-colors border border-purple-400/30"
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
                <div className="text-3xl font-bold text-purple-600">{announcements?.length || 0}+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">진행중인 공고</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">최대 3억</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">지원금 규모</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">7년 이내</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">창업 업력</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">30초</div>
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
              스타트업 주요 정부지원사업
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  초기창업패키지
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  창업 3년 이내 스타트업 대상. 최대 1억 원 지원.
                  사업화 자금, 멘토링, 네트워킹 등 종합 지원.
                </p>
                <span className="text-purple-600 font-medium text-sm">지원금: 최대 1억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  예비창업패키지
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  예비창업자 대상. 최대 1억 원 지원.
                  창업 교육, 사업화 자금, 공간 등 창업 준비 지원.
                </p>
                <span className="text-blue-600 font-medium text-sm">지원금: 최대 1억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Banknote className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  TIPS (민간투자주도형)
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  기술창업 스타트업 대상. R&D 최대 5억 원 + 추가 지원.
                  엔젤투자와 연계된 집중 지원 프로그램.
                </p>
                <span className="text-green-600 font-medium text-sm">지원금: 최대 5억 원+</span>
              </div>
            </div>
          </section>

          {/* 현재 진행중인 공고 */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                지금 신청 가능한 스타트업 지원사업
              </h2>
              <Link
                href="/dashboard/announcements?category=startup"
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
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
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
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
                        <span className="font-medium text-purple-600">
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
          <section className="mb-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              스타트업 지원 자격 조건
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">일반적인 지원 자격</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    창업 후 7년 이내 기업 (사업마다 상이)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    중소기업기본법상 중소기업
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    기술 기반 창업 기업 우대
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    벤처인증, 이노비즈 보유 시 가점
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">제외 대상</h3>
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
                    동일 사업 중복 지원
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              우리 스타트업에 맞는 지원사업 찾기
            </h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              사업자번호만 입력하면 30초 만에 AI가 적합한 지원사업을 분석해드려요.
              무료로 체험해보세요!
            </p>
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors text-lg"
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
