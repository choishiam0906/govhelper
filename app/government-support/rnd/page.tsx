import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Calendar, Lightbulb, Banknote, ArrowRight, FlaskConical } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'

export const metadata: Metadata = {
  title: 'R&D 정부지원사업 2026 | 연구개발 지원금 총정리 - GovHelper',
  description: '2026년 R&D 연구개발 정부지원사업 총정리! 중소기업 R&D, 기술개발, 산학연 협력, 정보통신기술(ICT) 지원 등 R&D 맞춤 지원사업을 AI가 분석해 추천해드려요.',
  keywords: [
    'R&D 정부지원',
    '연구개발 지원금',
    '기술개발 지원',
    '산학연 협력',
    'ICT R&D',
    '중소기업 R&D',
    '과기부 지원',
    '기술사업화',
    '2026 R&D지원',
  ],
  openGraph: {
    title: 'R&D 정부지원사업 2026 | 연구개발 지원금 총정리',
    description: '2026년 R&D 연구개발 정부지원사업 총정리! 기술개발, 산학연 협력 등 AI 맞춤 추천',
    url: 'https://govhelpers.com/government-support/rnd',
    type: 'website',
  },
  alternates: {
    canonical: 'https://govhelpers.com/government-support/rnd',
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
  { name: 'R&D', url: 'https://govhelpers.com/government-support/rnd' },
]

// R&D 관련 키워드
const rndKeywords = ['R&D', '연구개발', '기술개발', '기술', '혁신', 'ICT', '산학연', '과제']

export default async function RndSupportPage() {
  const supabase = await createClient()

  // R&D 관련 공고 조회
  const { data } = await supabase
    .from('announcements')
    .select('id, title, organization, support_amount, application_end, category, source')
    .eq('status', 'active')
    .or(rndKeywords.map(k => `title.ilike.%${k}%`).join(','))
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
              <span className="text-gray-900 dark:text-gray-100">R&D</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <FlaskConical className="h-4 w-4" />
                <span className="text-sm font-medium">2026년 R&D 지원사업</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                R&D 정부지원사업
                <br />
                <span className="text-emerald-200">기술혁신을 위한 연구개발 지원</span>
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-2xl">
                중소기업 R&D, 기술개발, 산학연 협력 사업 등 다양한
                연구개발 지원사업을 검색하고 AI 매칭으로 적합도를 분석하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/try"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  무료 AI 매칭 받기
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard/announcements?category=rnd"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/30 text-white font-semibold rounded-lg hover:bg-emerald-500/40 transition-colors border border-emerald-400/30"
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
                <div className="text-3xl font-bold text-emerald-600">{announcements?.length || 0}+</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">진행중인 공고</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">최대 100억</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">지원금 규모</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">2~5년</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">과제 수행 기간</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">30초</div>
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
              R&D 주요 정부지원사업
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  중소기업 기술개발 지원
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  중소기업 R&D 역량 강화. 제품/공정 개발,
                  품질 향상 등을 위한 기술개발 비용 지원.
                </p>
                <span className="text-emerald-600 font-medium text-sm">지원금: 최대 5억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <FlaskConical className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  산학연 협력 R&D
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  대학, 연구기관과 기업이 협력하는 공동연구.
                  기초연구부터 사업화까지 전주기 지원.
                </p>
                <span className="text-blue-600 font-medium text-sm">지원금: 최대 20억 원</span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Banknote className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  ICT R&D
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  AI, 빅데이터, 클라우드, IoT 등 ICT 분야 기술개발.
                  과기정통부 주관 대규모 지원사업.
                </p>
                <span className="text-purple-600 font-medium text-sm">지원금: 최대 100억 원</span>
              </div>
            </div>
          </section>

          {/* 현재 진행중인 공고 */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                지금 신청 가능한 R&D 지원사업
              </h2>
              <Link
                href="/dashboard/announcements?category=rnd"
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
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
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
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
                        <span className="font-medium text-emerald-600">
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
          <section className="mb-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              R&D 지원 자격 조건
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">일반적인 지원 자격</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    기업부설연구소 또는 연구개발전담부서 보유
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    관련 분야 연구 인력 보유
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    기술개발 수행 능력 입증
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    벤처인증, 이노비즈 보유 시 가점
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">지원 제외 대상</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    기술개발 제한 또는 참여제한 중인 기업
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    동일 기술 중복 지원
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    부도, 회생절차 중인 기업
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    과제 불성실 수행 전력 기업
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              우리 기업에 맞는 R&D 지원사업 찾기
            </h2>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              사업자번호만 입력하면 30초 만에 AI가 적합한 R&D 지원사업을 분석해드려요.
              무료로 체험해보세요!
            </p>
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors text-lg"
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
