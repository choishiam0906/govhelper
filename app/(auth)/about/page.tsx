import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  Search,
  TrendingUp,
  FileText,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  Building2,
  Sparkles,
  Database,
  Brain,
} from "lucide-react"

export const metadata = {
  title: "서비스 소개 | GovHelper",
  description: "AI 기반 정부지원사업 매칭 및 지원서 작성 서비스 GovHelper를 소개합니다.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl">GovHelper</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">무료 시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>
          <Badge variant="secondary" className="mb-4">
            AI 기반 정부지원사업 플랫폼
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            GovHelper가{" "}
            <span className="text-primary">특별한 이유</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            정부지원사업 검색부터 지원서 작성까지, AI가 함께하는 새로운 경험을 만나보세요.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              이런 어려움, 겪어보셨나요?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    시간 부족
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    여러 사이트를 돌아다니며 공고를 찾는 데만 하루가 걸려요.
                    정작 중요한 사업에 집중할 시간이 없어요.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="w-5 h-5 text-orange-500" />
                    정보 분산
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    나라장터, 기업마당, K-Startup... 너무 많은 사이트에
                    흩어져 있어서 놓치는 공고가 많아요.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    지원서 작성
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    어떻게 써야 선정될 수 있을지 막막해요.
                    평가 기준에 맞게 작성하는 게 너무 어려워요.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              GovHelper가 해결해드려요
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              AI 기술로 정부지원사업의 모든 과정을 쉽고 빠르게
            </p>

            <div className="space-y-8">
              {/* Feature 1 */}
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Database className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">통합 공고 검색</h3>
                      <p className="text-muted-foreground mb-4">
                        중소벤처24, 기업마당, K-Startup 등 주요 정부지원사업 플랫폼의 공고를
                        한 곳에서 검색하세요. 더 이상 여러 사이트를 돌아다닐 필요가 없어요.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">중소벤처24</Badge>
                        <Badge variant="outline">기업마당</Badge>
                        <Badge variant="outline">K-Startup</Badge>
                        <Badge variant="outline">실시간 동기화</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Brain className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">AI 매칭 분석</h3>
                      <p className="text-muted-foreground mb-4">
                        기업 정보를 입력하면 AI가 수천 개의 공고 중에서 우리 기업에 맞는 지원사업을 찾아드려요.
                        0-100점 매칭 점수와 함께 선정 가능성까지 분석해요.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Gemini AI</Badge>
                        <Badge variant="outline">매칭 점수</Badge>
                        <Badge variant="outline">선정 가능성 분석</Badge>
                        <Badge variant="outline">맞춤 추천</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">AI 지원서 작성</h3>
                      <p className="text-muted-foreground mb-4">
                        공고의 평가 기준과 기업 정보를 분석해서 설득력 있는 지원서 초안을 작성해드려요.
                        섹션별로 AI가 개선 제안도 해드려요.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">자동 초안 작성</Badge>
                        <Badge variant="outline">평가 기준 분석</Badge>
                        <Badge variant="outline">섹션별 개선</Badge>
                        <Badge variant="outline">PDF 다운로드</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">AI 자동 분류</h3>
                      <p className="text-muted-foreground mb-4">
                        공고가 동기화될 때 AI가 자동으로 지원자격을 분석하고 구조화해요.
                        기업유형, 업종, 지역, 필요 인증 등을 한눈에 확인할 수 있어요.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">자동 파싱</Badge>
                        <Badge variant="outline">지원자격 분석</Badge>
                        <Badge variant="outline">필터링 지원</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              GovHelper를 사용하면
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">시간 절약</h3>
                  <p className="text-sm text-muted-foreground">
                    공고 검색에 걸리던 시간을 90% 이상 줄여요.
                    한 곳에서 모든 공고를 확인하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">정확한 매칭</h3>
                  <p className="text-sm text-muted-foreground">
                    AI가 기업 조건에 맞는 공고만 추천해요.
                    불필요한 공고는 걸러드려요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">품질 높은 지원서</h3>
                  <p className="text-sm text-muted-foreground">
                    평가 기준에 맞춘 지원서로 선정 가능성을 높여요.
                    AI가 작성을 도와드려요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">놓치는 기회 없이</h3>
                  <p className="text-sm text-muted-foreground">
                    매일 업데이트되는 공고를 실시간으로 확인하세요.
                    중요한 기회를 놓치지 않아요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              이런 분들께 추천해요
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              정부지원사업을 찾고 계신 모든 중소기업과 스타트업
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">스타트업</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    창업 초기 자금이 필요한 스타트업.
                    R&D, 마케팅, 인력 채용 지원사업을 찾아보세요.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">성장기 기업</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    사업 확장을 준비하는 기업.
                    수출, 해외진출, 설비투자 지원사업을 확인하세요.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">중소기업</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    경쟁력 강화가 필요한 중소기업.
                    기술개발, 인력양성, 경영안정 지원사업을 만나보세요.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              합리적인 요금제
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              무료로 시작하고, 필요할 때 업그레이드하세요
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>모든 분께 무료로</CardDescription>
                  <div className="text-3xl font-bold mt-4">무료</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI 매칭 분석 무제한
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI 시맨틱 검색 무제한
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      공고 검색 무제한
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <Badge className="w-fit mb-2">추천</Badge>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>AI 지원서 작성이 필요할 때</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    ₩50,000<span className="text-sm font-normal text-muted-foreground">/월</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Free 플랜의 모든 기능
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI 지원서 초안 작성
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI 섹션별 개선 제안
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      우선 고객 지원
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            무료로 가입하고 우리 기업에 맞는 정부지원사업을 찾아보세요.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              무료로 시작하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <span className="font-semibold">GovHelper</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">이용약관</Link>
              <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
              <a href="mailto:choishiam@gmail.com" className="hover:text-foreground">문의하기</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 GovHelper. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
