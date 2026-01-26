import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Building2, Rocket, FlaskConical, Banknote, ArrowRight, Search } from 'lucide-react'
import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'

export const metadata: Metadata = {
  title: '정부지원사업 2026 | 정부지원금 총정리 - GovHelper',
  description: '2026년 정부지원사업 총정리! 중소기업, 스타트업, R&D 지원금 등 모든 정부지원사업을 한눈에 검색하고 AI가 우리 기업에 맞는 지원사업을 추천해드려요.',
  keywords: [
    '정부지원사업',
    '정부지원금',
    '중소기업 지원',
    '스타트업 지원',
    'R&D 지원',
    '창업 지원금',
    '기업 보조금',
    '2026 정부지원',
    '중소벤처24',
  ],
  openGraph: {
    title: '정부지원사업 2026 | 정부지원금 총정리',
    description: '2026년 정부지원사업 총정리! 중소기업, 스타트업, R&D 지원금 등 AI 맞춤 추천',
    url: 'https://govhelpers.com/government-support',
    type: 'website',
  },
  alternates: {
    canonical: 'https://govhelpers.com/government-support',
  },
}

const breadcrumbItems = [
  { name: '홈', url: 'https://govhelpers.com' },
  { name: '정부지원사업', url: 'https://govhelpers.com/government-support' },
]

// 공고 타입 정의
interface AnnouncementItem {
  id: string
  title: string
  organization: string | null
  support_amount: string | null
  application_end: string | null
  source: string | null
}

const categories = [
  {
    title: '스타트업 지원',
    description: '창업 초기 스타트업을 위한 지원사업',
    icon: Rocket,
    color: 'purple',
    href: '/government-support/startup',
    keywords: ['초기창업패키지', '예비창업패키지', 'TIPS', '창업지원'],
  },
  {
    title: '중소기업 지원',
    description: '중소기업 성장을 위한 지원사업',
    icon: Building2,
    color: 'blue',
    href: '/government-support/sme',
    keywords: ['스마트공장', '수출바우처', '고용지원', '제조혁신'],
  },
  {
    title: 'R&D 지원',
    description: '연구개발 및 기술혁신 지원사업',
    icon: FlaskConical,
    color: 'emerald',
    href: '/government-support/rnd',
    keywords: ['기술개발', '산학연협력', 'ICT R&D', '기술사업화'],
  },
]

export default async function GovernmentSupportPage() {
  const supabase = await createClient()

  // 전체 활성 공고 수
  const { count: totalCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // 마감 임박 공고 (7일 이내)
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  const { data } = await supabase
    .from('announcements')
    .select('id, title, organization, support_amount, application_end, source')
    .eq('status', 'active')
    .lte('application_end', sevenDaysLater.toISOString())
    .gte('application_end', new Date().toISOString())
    .order('application_end', { ascending: true })
    .limit(6)

  const urgentAnnouncements = (data || []) as AnnouncementItem[]

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
              <span className="text-gray-900 dark:text-gray-100">정부지원사업</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                2026년 정부지원사업
                <br />
                <span className="text-blue-400">AI가 찾아주는 맞춤 지원금</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                중소벤처24, 기업마당, K-Startup, 나라장터의 모든 공고를 통합 검색.
                AI가 우리 기업에 딱 맞는 지원사업을 분석해드려요.
              </p>

              {/* Search CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/try"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
                >
                  무료 AI 매칭 받기
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard/announcements"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-lg border border-white/20"
                >
                  <Search className="h-5 w-5" />
                  공고 검색하기
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div>
                  <div className="text-3xl font-bold text-blue-400">{totalCount || 0}+</div>
                  <div className="text-gray-400 text-sm">활성 공고</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">4개</div>
                  <div className="text-gray-400 text-sm">통합 플랫폼</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">30초</div>
                  <div className="text-gray-400 text-sm">AI 분석</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            카테고리별 정부지원사업
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon
              const colorClasses = {
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
              }
              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border hover:shadow-lg transition-shadow group"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${colorClasses[category.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Urgent Announcements */}
        {urgentAnnouncements.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    마감 임박 공고
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">7일 이내 마감되는 공고들이에요</p>
                </div>
                <Link
                  href="/dashboard/announcements"
                  className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                >
                  전체보기 <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {urgentAnnouncements.map((announcement) => {
                  const dday = getDday(announcement.application_end)
                  return (
                    <Link
                      key={announcement.id}
                      href={`/dashboard/announcements/${announcement.id}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {announcement.source}
                        </span>
                        <span className="text-sm font-bold text-red-500">
                          D-{dday}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {announcement.organization}
                      </p>
                      {announcement.support_amount && (
                        <span className="text-sm font-medium text-blue-600">
                          {announcement.support_amount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            GovHelper 사용 방법
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">사업자번호 입력</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                사업자번호만 입력하면 기업 정보를 자동으로 불러와요
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">AI 매칭 분석</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                30초 만에 AI가 적합한 지원사업을 분석해요
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">맞춤 추천</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                적합도 점수와 함께 맞는 이유를 상세히 보여드려요
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">지원서 작성</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI가 지원서 초안까지 자동으로 작성해드려요
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              지금 바로 맞춤 지원사업을 찾아보세요
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              사업자번호만 입력하면 30초 만에 AI가 분석해드려요. 무료로 체험해보세요!
            </p>
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg"
            >
              무료 AI 매칭 시작하기
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
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
