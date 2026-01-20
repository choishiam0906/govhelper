import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  TrendingUp,
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Gift,
  Sparkles,
} from "lucide-react";
import { isPromotionActive, getPromotionDaysRemaining, PROMOTION_CONFIG } from "@/lib/queries/dashboard";

export default function Home() {
  const promotionActive = isPromotionActive()
  const promotionDaysRemaining = getPromotionDaysRemaining()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 프로모션 배너 */}
      {promotionActive && (
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 text-sm md:text-base">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium">{PROMOTION_CONFIG.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Pro 무료
              </Badge>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">{PROMOTION_CONFIG.description}</span>
              <Badge variant="outline" className="border-white/50 text-white">
                D-{promotionDaysRemaining}
              </Badge>
            </div>
          </div>
        </div>
      )}

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
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              공고 검색
            </Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              AI 매칭
            </Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              지원서 작성
            </Link>
          </nav>
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
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            AI 기반 정부지원사업 매칭
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            정부지원사업,{" "}
            <span className="text-primary">AI가 찾아드립니다</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            수천 개의 정부지원사업 중 우리 기업에 딱 맞는 사업을 AI가 분석하고 매칭합니다.
            복잡한 지원서 작성도 AI가 도와드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                무료로 시작하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                공고 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">5,000+</div>
              <div className="text-sm text-muted-foreground mt-1">수집된 공고 수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">92%</div>
              <div className="text-sm text-muted-foreground mt-1">매칭 정확도</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground mt-1">사용 기업 수</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50억+</div>
              <div className="text-sm text-muted-foreground mt-1">선정 지원금</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">왜 GovHelper인가요?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            정부지원사업 탐색부터 지원서 작성까지, 모든 과정을 AI가 도와드립니다.
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
                나라장터, 기업마당, K-Startup 등 주요 플랫폼의 공고를 한 곳에서 검색하세요.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI 매칭 분석</CardTitle>
              <CardDescription>
                기업 프로필과 사업계획서를 분석하여 적합한 지원사업을 추천하고 선정 가능성을 예측합니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI 지원서 작성</CardTitle>
              <CardDescription>
                Claude AI가 평가 기준에 맞춰 설득력 있는 지원서 초안을 작성해 드립니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">이용 방법</h2>
            <p className="text-muted-foreground">간단한 3단계로 시작하세요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">기업 정보 등록</h3>
              <p className="text-sm text-muted-foreground">
                기업 프로필과 사업계획서를 등록하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">AI 매칭 분석</h3>
              <p className="text-sm text-muted-foreground">
                AI가 최적의 지원사업을 찾아 매칭률을 분석합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">지원서 작성</h3>
              <p className="text-sm text-muted-foreground">
                AI가 작성한 지원서 초안을 검토하고 제출하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">요금제</h2>
          <p className="text-muted-foreground">무료로 시작하고, 필요할 때 업그레이드하세요</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
              <Badge className="w-fit mb-2">인기</Badge>
              <CardTitle>Pro</CardTitle>
              <CardDescription>AI 지원서 작성이 필요할 때</CardDescription>
              <div className="text-3xl font-bold mt-4">₩50,000<span className="text-sm font-normal text-muted-foreground">/월</span></div>
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
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            우리 기업에 맞는 정부지원사업을 AI가 찾아드립니다. 무료로 시작해보세요.
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
                <li><Link href="/register" className="hover:text-foreground">공고 검색</Link></li>
                <li><Link href="/register" className="hover:text-foreground">AI 매칭</Link></li>
                <li><Link href="/register" className="hover:text-foreground">지원서 작성</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">서비스 소개</Link></li>
                <li><Link href="/register" className="hover:text-foreground">요금제</Link></li>
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
