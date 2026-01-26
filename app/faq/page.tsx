import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { FaqJsonLd } from '@/components/seo/faq-json-ld'

export const metadata: Metadata = {
  title: '자주 묻는 질문 (FAQ) | GovHelper',
  description: '정부지원사업 신청, AI 매칭, 지원서 작성에 관한 자주 묻는 질문과 답변을 확인하세요. 중소기업, 스타트업을 위한 정부지원금 안내.',
  keywords: ['정부지원사업 FAQ', '지원금 신청 방법', 'AI 매칭', '정부지원 자격', '중소기업 지원', '스타트업 지원금'],
  openGraph: {
    title: '자주 묻는 질문 (FAQ) | GovHelper',
    description: '정부지원사업 신청, AI 매칭, 지원서 작성에 관한 자주 묻는 질문과 답변',
    url: 'https://govhelpers.com/faq',
  },
  alternates: {
    canonical: 'https://govhelpers.com/faq',
  },
}

// FAQ 데이터 - 검색 키워드 최적화
const faqCategories = [
  {
    title: '정부지원사업 기본',
    faqs: [
      {
        question: '정부지원사업이란 무엇인가요?',
        answer: '정부지원사업은 중소기업, 스타트업, 소상공인 등을 대상으로 정부가 자금, 기술, 인력 등을 지원하는 사업이에요. 중소벤처기업부, 산업통상자원부, 과학기술정보통신부 등 다양한 부처에서 운영하며, R&D 지원금, 창업 지원, 수출 지원 등 여러 유형이 있어요.',
      },
      {
        question: '어떤 기업이 정부지원사업에 지원할 수 있나요?',
        answer: '대부분의 정부지원사업은 중소기업, 스타트업, 예비창업자, 소상공인을 대상으로 해요. 사업마다 업종, 업력, 매출, 직원수 등의 조건이 다르므로 공고를 잘 확인해야 해요. GovHelper의 AI 매칭 기능을 사용하면 우리 기업에 맞는 지원사업을 자동으로 찾아드려요.',
      },
      {
        question: '정부지원금은 얼마나 받을 수 있나요?',
        answer: '지원금 규모는 사업마다 달라요. 소규모 사업은 수백만 원부터 대규모 R&D 사업은 수십억 원까지 지원해요. 일반적으로 창업 지원 1천만 원~1억 원, R&D 지원 1억 원~50억 원, 수출 지원 1천만 원~5천만 원 수준이에요.',
      },
      {
        question: '정부지원사업 신청은 어디서 하나요?',
        answer: '중소벤처24(www.smes.go.kr), 기업마당(www.bizinfo.go.kr), K-Startup(www.k-startup.go.kr) 등에서 신청할 수 있어요. GovHelper에서는 이 모든 공고를 통합 검색하고, 원클릭으로 신청 페이지로 이동할 수 있어요.',
      },
    ],
  },
  {
    title: 'GovHelper 서비스',
    faqs: [
      {
        question: 'GovHelper는 어떤 서비스인가요?',
        answer: 'GovHelper는 AI 기반 정부지원사업 매칭 플랫폼이에요. 중소벤처24, 기업마당, K-Startup, 나라장터의 공고를 통합 검색하고, AI가 우리 기업에 맞는 지원사업을 분석해 추천해드려요. 또한 AI 지원서 작성 기능으로 시간을 절약할 수 있어요.',
      },
      {
        question: 'AI 매칭은 어떻게 작동하나요?',
        answer: 'AI 매칭은 기업 정보(업종, 직원수, 매출, 지역 등)와 공고의 지원자격을 분석하여 적합도 점수를 계산해요. 각 조건별로 점수를 세분화하여 어떤 조건이 맞고 안 맞는지 상세하게 보여드려요.',
      },
      {
        question: '무료로 사용할 수 있나요?',
        answer: '네, 공고 검색과 AI 시맨틱 검색은 무료로 사용할 수 있어요. AI 매칭 분석의 3~5순위 공고도 무료로 확인할 수 있어요. 더 많은 기능(전체 매칭 결과, AI 지원서 작성)은 Pro 또는 Premium 플랜에서 이용할 수 있어요.',
      },
      {
        question: '회원가입 없이도 사용할 수 있나요?',
        answer: '네, 비회원 AI 매칭 분석을 제공해요. 사업자번호와 기본 정보만 입력하면 30초 만에 맞춤 공고를 분석해드려요. 단, 상위 1~2순위 결과는 회원가입 후 확인할 수 있어요.',
      },
    ],
  },
  {
    title: '지원서 작성',
    faqs: [
      {
        question: '정부지원사업 지원서는 어떻게 작성하나요?',
        answer: '지원서는 보통 사업개요, 기술개발 내용, 사업화 계획, 추진 일정, 예산 계획 등의 섹션으로 구성돼요. GovHelper의 AI 지원서 작성 기능을 사용하면 공고 요구사항에 맞춰 초안을 자동 생성하고, 섹션별로 개선 제안을 받을 수 있어요.',
      },
      {
        question: '사업계획서를 업로드하면 어떤 장점이 있나요?',
        answer: '사업계획서 PDF를 업로드하면 AI가 내용을 분석하여 매칭 분석과 지원서 작성에 활용해요. 기업 프로필을 일일이 입력할 필요 없이, 사업계획서 기반으로 더 정확한 추천을 받을 수 있어요.',
      },
      {
        question: '지원서를 PDF나 한글 파일로 다운로드할 수 있나요?',
        answer: '네, GovHelper에서 작성한 지원서는 PDF와 HWPX(한글) 형식으로 다운로드할 수 있어요. 대부분의 정부지원사업에서 요구하는 형식으로 바로 제출할 수 있어요.',
      },
    ],
  },
  {
    title: '결제 및 구독',
    faqs: [
      {
        question: '요금제는 어떻게 되나요?',
        answer: 'Free(무료), Pro(월 5,000원), Premium(월 50,000원) 3가지 플랜이 있어요. Free는 공고 검색과 기본 매칭, Pro는 전체 매칭 결과와 상세 분석, Premium은 AI 지원서 작성까지 이용할 수 있어요.',
      },
      {
        question: '결제는 어떻게 하나요?',
        answer: '토스페이먼츠를 통해 안전하게 결제할 수 있어요. 신용카드, 체크카드, 간편결제(토스, 네이버페이, 카카오페이 등)를 지원해요.',
      },
      {
        question: '구독을 취소하면 어떻게 되나요?',
        answer: '구독 취소는 설정 페이지에서 언제든지 할 수 있어요. 취소해도 남은 구독 기간까지는 Pro/Premium 기능을 그대로 사용할 수 있어요. 자동 갱신만 중지돼요.',
      },
    ],
  },
]

// 모든 FAQ를 평탄화 (JSON-LD용)
const allFaqs = faqCategories.flatMap(category => category.faqs)

export default function FaqPage() {
  return (
    <>
      <FaqJsonLd faqs={allFaqs} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600">홈</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 dark:text-gray-100">자주 묻는 질문</span>
            </nav>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">자주 묻는 질문 (FAQ)</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              정부지원사업 신청부터 GovHelper 사용법까지, 궁금한 점을 확인하세요
            </p>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => (
                    <details
                      key={faqIndex}
                      className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pr-4">
                          {faq.question}
                        </h3>
                        <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              더 궁금한 점이 있으신가요?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              AI 매칭으로 우리 기업에 맞는 정부지원사업을 찾아보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/try"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                무료로 매칭 분석받기
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t mt-16 py-8">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2026 GovHelper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
