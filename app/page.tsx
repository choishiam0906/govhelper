import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Brain,
  Target,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Award,
} from "lucide-react";
import { StatsSection, AIExpertiseStats } from "@/components/landing/stats-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl">GovHelper</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              서비스 소개
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              이용 방법
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              요금제
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/try">
              <Button size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                무료 매칭받기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Brain className="w-3 h-3" />
            200건+ 합격 지원서 분석 AI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            정부지원금 <span className="text-primary">3,000만원</span>,<br />
            우리 기업도 받을 수 있을까?
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            <span className="font-semibold text-foreground">30초</span>만 투자하세요.
            AI가 수천 개 지원사업 중 우리 기업에 <span className="font-semibold text-foreground">딱 맞는 사업</span>을 찾아드려요.
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            연간 <span className="font-semibold text-foreground">50조원</span>의 정부지원금,
            아직도 직접 찾고 계세요?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/try">
              <Button size="lg" className="gap-2 text-base px-8">
                <Sparkles className="w-5 h-5" />
                30초 만에 무료 매칭받기
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            회원가입 없이 바로 분석 · 이메일만 입력하면 결과 발송
          </p>
        </div>
      </section>

      {/* Social Proof - Stats Section */}
      <StatsSection />

      {/* Pain Point Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">이런 고민, 해보셨나요?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-red-50/50 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">"지원사업 찾느라 하루가 다 가요"</p>
                    <p className="text-sm text-red-700 mt-1">
                      나라장터, 기업마당, K-Startup... 사이트만 수십 개
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">"우리 회사가 대상인지 모르겠어요"</p>
                    <p className="text-sm text-red-700 mt-1">
                      공고문이 너무 복잡해서 자격 요건 파악이 어려움
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">"선정 가능성이 얼마나 될까요?"</p>
                    <p className="text-sm text-red-700 mt-1">
                      시간 투자해서 지원해도 떨어지면 허탈함
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-100">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">"마감일 놓쳐서 기회를 날렸어요"</p>
                    <p className="text-sm text-red-700 mt-1">
                      좋은 공고 발견했는데 이미 마감된 경우가 많음
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Expertise Section */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Brain className="w-3 h-3 mr-1" />
                AI 전문성
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                단순 AI 래퍼가 아닙니다
              </h2>
              <AIExpertiseStats />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">합격 패턴 학습</CardTitle>
                  <CardDescription>
                    실제 선정된 지원서의 공통점을 분석하여 매칭 알고리즘에 반영
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">자격요건 자동 파싱</CardTitle>
                  <CardDescription>
                    복잡한 공고문에서 핵심 자격요건을 AI가 자동으로 추출
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">적합도 점수 산출</CardTitle>
                  <CardDescription>
                    기업 정보와 공고 요건을 매칭하여 0~100점 적합도 예측
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">GovHelper가 해결해 드려요</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            정부지원사업 탐색의 모든 어려움, AI가 대신 처리합니다.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>통합 공고 검색</CardTitle>
              <CardDescription>
                나라장터, 기업마당, K-Startup, 중소벤처24 등 <span className="font-medium text-foreground">주요 플랫폼 공고를 한 곳에서</span> 검색하세요.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>AI 매칭 분석</CardTitle>
              <CardDescription>
                기업 정보를 입력하면 <span className="font-medium text-foreground">적합한 지원사업을 자동 추천</span>하고 선정 가능성을 예측합니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>자격요건 자동 분석</CardTitle>
              <CardDescription>
                복잡한 공고문을 AI가 분석하여 <span className="font-medium text-foreground">우리 기업이 대상인지</span> 바로 확인할 수 있어요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">이용 방법</h2>
            <p className="text-muted-foreground">30초면 충분해요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">기업 정보 입력</h3>
              <p className="text-sm text-muted-foreground">
                사업자번호 입력하면 기본 정보 자동 입력
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">AI 매칭 분석</h3>
              <p className="text-sm text-muted-foreground">
                AI가 5,000개+ 공고 중 적합한 사업 추출
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">결과 확인</h3>
              <p className="text-sm text-muted-foreground">
                매칭률 높은 순으로 정렬된 결과 이메일 발송
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/try">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                지금 무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    평균 지원금 3,000만원
                  </h2>
                  <p className="text-primary-foreground/90 mb-6">
                    정부지원사업 선정 시 받을 수 있는 평균 지원금입니다.
                    GovHelper로 매칭된 기업의 <span className="font-bold">78%가 실제 선정</span>되었어요.
                  </p>
                  <ul className="space-y-2 text-sm text-primary-foreground/90">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      R&D 지원금: 최대 5억원
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      고용지원금: 인당 최대 1,200만원
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      창업지원금: 최대 1억원
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <div className="text-5xl md:text-6xl font-bold mb-2">78%</div>
                    <div className="text-primary-foreground/80">매칭 후 선정률</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">요금제</h2>
          <p className="text-muted-foreground">무료로 시작하고, 필요할 때 업그레이드하세요</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free 플랜 */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>서비스 체험</CardDescription>
              <div className="text-3xl font-bold mt-4">무료</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  공고 검색 무제한
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI 시맨틱 검색
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI 매칭 분석 (2~5순위)
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4" />
                  1순위 매칭 결과 잠금
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro 플랜 */}
          <Card className="border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary">추천</Badge>
            </div>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>커피 한 잔 가격으로 전체 매칭</CardDescription>
              <div className="text-3xl font-bold mt-4">
                ₩5,000<span className="text-sm font-normal text-muted-foreground">/월</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Free 플랜의 모든 기능
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  AI 매칭 전체 공개 (1~5순위)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  상세 분석 리포트
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  마감 알림 서비스
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium 플랜 */}
          <Card>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>AI 지원서 작성까지</CardDescription>
              <div className="text-3xl font-bold mt-4">
                ₩49,000<span className="text-sm font-normal text-muted-foreground">/월</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pro 플랜의 모든 기능
                </li>
                <li className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle className="w-4 h-4 text-primary" />
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
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 무료로 매칭받아 보세요
          </h2>
          <p className="text-primary-foreground/80 mb-2 max-w-xl mx-auto">
            회원가입 없이 30초만 투자하면
          </p>
          <p className="text-2xl font-bold mb-8">
            평균 3,000만원 지원금의 기회를 확인할 수 있어요
          </p>
          <Link href="/try">
            <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
              <Sparkles className="w-5 h-5" />
              무료 매칭 시작하기
            </Button>
          </Link>
          <p className="text-sm text-primary-foreground/60 mt-4">
            이메일만 입력하면 결과를 바로 확인할 수 있어요
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">G</span>
                </div>
                <span className="font-bold text-xl">GovHelper</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI 기반 정부지원사업 매칭 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/try" className="hover:text-foreground">무료 매칭</Link></li>
                <li><Link href="/register" className="hover:text-foreground">회원가입</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">요금제</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">서비스 소개</Link></li>
                <li><Link href="mailto:choishiam@gmail.com" className="hover:text-foreground">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 GovHelper. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
