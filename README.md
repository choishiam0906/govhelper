# GovHelper - AI 기반 정부지원사업 매칭 플랫폼

<p align="center">
  <strong>중소기업과 스타트업을 위한 AI 기반 정부지원사업 매칭 및 지원서 작성 도우미</strong>
</p>

<p align="center">
  <a href="https://govhelpers.com">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [BRD (Business Requirements Document)](#brd-business-requirements-document)
- [PRD (Product Requirements Document)](#prd-product-requirements-document)
- [TRD (Technical Requirements Document)](#trd-technical-requirements-document)
- [Project Progress](#project-progress)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)

---

## Project Overview

GovHelper는 수천 개의 정부지원사업 중 기업에 맞는 사업을 AI로 매칭하고, 지원서 작성을 도와주는 SaaS 플랫폼입니다.

### Key Value Proposition
- **시간 절약**: 수천 개 공고 중 적합한 사업을 AI가 자동 분석
- **매칭 정확도**: 기업 정보 기반 0-100점 매칭 점수 제공
- **지원서 자동화**: AI가 지원서 초안을 자동 생성

---

## BRD (Business Requirements Document)

### 1. Executive Summary

| 항목 | 내용 |
|------|------|
| **프로젝트명** | GovHelper |
| **목표** | 중소기업의 정부지원사업 접근성 향상 |
| **대상 고객** | 중소기업, 스타트업, 소상공인 |
| **시장 규모** | 연간 정부지원사업 예산 약 20조원+ |

### 2. Business Objectives

| 목표 | 성과 지표 (KPI) |
|------|-----------------|
| 사용자 확보 | MAU 10,000명 (6개월 내) |
| 유료 전환율 | Free → Pro 전환율 5% |
| 매칭 정확도 | 사용자 만족도 80% 이상 |
| 지원서 작성 효율 | 작성 시간 70% 단축 |

### 3. Revenue Model

| 플랜 | 가격 | 기능 |
|------|------|------|
| **Free** | ₩0 | 공고 검색 무제한, AI 매칭 월 3회 |
| **Pro 월간** | ₩50,000/월 | 무제한 매칭, 월 10회 지원서 |
| **Pro 연간** | ₩500,000/년 | 무제한 매칭, 무제한 지원서, 우선 지원 |

### 4. Target Users

```
┌─────────────────────────────────────────────────────────────┐
│                    Target User Segments                      │
├─────────────────────────────────────────────────────────────┤
│  🏢 중소기업 (50인 이하)     - 정부지원사업 담당자            │
│  🚀 스타트업               - 창업자, 사업개발 담당자          │
│  🏪 소상공인               - 1인 사업자, 자영업자             │
│  📊 컨설팅 기업            - 지원사업 대행 업체               │
└─────────────────────────────────────────────────────────────┘
```

### 5. Competitive Analysis

| 경쟁사 | 강점 | 약점 | GovHelper 차별점 |
|--------|------|------|------------------|
| 기업마당 | 공공 데이터 | UX 부족, 매칭 없음 | AI 매칭 |
| K-Startup | 스타트업 특화 | 범위 제한 | 통합 플랫폼 |
| 수동 검색 | 무료 | 시간 소요 | 자동화 |

---

## PRD (Product Requirements Document)

### 1. Product Vision

> "모든 중소기업이 정부지원사업의 혜택을 쉽게 받을 수 있도록 AI로 연결한다"

### 2. Feature Requirements

#### 2.1 사용자 인증 (Authentication)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 이메일/비밀번호 로그인 | P0 | ✅ 완료 |
| Google OAuth | P0 | ✅ 완료 |
| 비밀번호 재설정 | P1 | ⏳ 예정 |
| 카카오 로그인 | P2 | ⏳ 예정 |

#### 2.2 기업 프로필 (Company Profile)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 기업 정보 등록 | P0 | ✅ 완료 |
| 온보딩 플로우 | P0 | ✅ 완료 |
| 프로필 수정 | P0 | ✅ 완료 |
| 인증 정보 관리 (벤처, 이노비즈 등) | P1 | ✅ 완료 |

**수집 정보:**
- 기업명, 사업자번호
- 업종, 직원 수, 설립일
- 소재지, 연매출
- 보유 인증 (벤처기업, 이노비즈, 메인비즈 등)

#### 2.3 공고 검색 (Announcement Search)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 통합 공고 검색 | P0 | ✅ 완료 |
| 필터링 (분야, 출처, 상태) | P0 | ✅ 완료 |
| 페이지네이션 | P0 | ✅ 완료 |
| 공고 상세 조회 | P0 | ✅ 완료 |
| 북마크 저장 | P1 | ✅ 완료 |
| 중소벤처24 API 연동 | P0 | ✅ 완료 |
| 자동 동기화 (Vercel Cron) | P1 | ✅ 완료 |

**데이터 소스:**
- 중소벤처24 (SMES)
- 나라장터
- 기업마당
- K-Startup

#### 2.4 AI 매칭 분석 (AI Matching)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 기업-공고 매칭 분석 | P0 | ✅ 완료 |
| 매칭 점수 (0-100) | P0 | ✅ 완료 |
| 상세 분석 리포트 | P0 | ✅ 완료 |
| 강점/약점/기회 분석 | P1 | ✅ 완료 |
| 사용량 제한 (Free: 3회/월) | P0 | ✅ 완료 |

**분석 항목:**
```
{
  "overallScore": 85,
  "requirement_alignment": { "score": 90, "details": [...] },
  "financial_feasibility": { "score": 80, "details": [...] },
  "strategic_fit": { "score": 85, "details": [...] },
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "opportunities": ["...", "..."],
  "recommendations": ["...", "..."]
}
```

#### 2.5 AI 지원서 작성 (AI Application Writer)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 지원서 초안 자동 생성 | P0 | ✅ 완료 |
| 섹션별 편집기 | P0 | ✅ 완료 |
| AI 섹션 개선 | P1 | ✅ 완료 |
| 지원서 목록 관리 | P0 | ✅ 완료 |
| HWP 파일 다운로드 | P2 | ⏳ 예정 |

**지원서 섹션:**
1. 사업 개요 (Executive Summary)
2. 기술 현황 (Technical Status)
3. 시장 분석 (Market Analysis)
4. 사업화 전략 (Commercialization Strategy)
5. 기대 효과 (Expected Outcomes)

#### 2.6 결제 및 구독 (Payment & Subscription)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| Toss Payments 연동 | P0 | ✅ 완료 |
| 무통장 입금 | P0 | ✅ 완료 |
| 구독 관리 | P0 | ✅ 완료 |
| 구독 취소 | P0 | ✅ 완료 |
| 관리자 결제 확인 | P0 | ✅ 완료 |
| 카카오페이 | P2 | ⏳ 예정 |
| 네이버페이 | P2 | ⏳ 예정 |

#### 2.7 대시보드 (Dashboard)

| 기능 | 우선순위 | 상태 |
|------|----------|------|
| 통계 요약 | P0 | ✅ 완료 |
| 최근 공고 표시 | P1 | ✅ 완료 |
| 빠른 메뉴 | P1 | ✅ 완료 |
| 구독 상태 표시 | P0 | ✅ 완료 |

### 3. User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Journey                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [회원가입] → [온보딩] → [대시보드] → [공고 검색] → [AI 매칭]    │
│                              │                          │         │
│                              ↓                          ↓         │
│                        [프로필 관리]              [매칭 결과]      │
│                              │                          │         │
│                              ↓                          ↓         │
│                        [구독 관리]  ←──────────  [지원서 작성]     │
│                              │                          │         │
│                              ↓                          ↓         │
│                          [결제]                   [AI 개선]       │
│                              │                          │         │
│                              └──────────────────────────┘         │
│                                         │                         │
│                                         ↓                         │
│                                    [제출/완료]                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4. Non-Functional Requirements

| 요구사항 | 목표 |
|----------|------|
| 페이지 로드 시간 | < 3초 |
| 가용성 | 99.5% uptime |
| 동시 접속자 | 1,000명 |
| AI 응답 시간 | < 30초 |
| 모바일 호환성 | 반응형 디자인 |

---

## TRD (Technical Requirements Document)

### 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Architecture                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │   Frontend   │────▶│   Next.js    │────▶│   Vercel     │   │
│   │   (React)    │     │   API Routes │     │   (Hosting)  │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│          │                     │                                 │
│          │                     ▼                                 │
│          │            ┌──────────────┐                          │
│          │            │   Supabase   │                          │
│          │            │  (PostgreSQL │                          │
│          │            │   + Auth)    │                          │
│          │            └──────────────┘                          │
│          │                     │                                 │
│          ▼                     ▼                                 │
│   ┌──────────────┐     ┌──────────────┐                         │
│   │   Gemini AI  │     │   External   │                         │
│   │   (Google)   │     │   APIs       │                         │
│   └──────────────┘     │  - SMES      │                         │
│                        │  - Toss Pay  │                         │
│                        └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.1.1 |
| **Frontend** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI + Shadcn | Latest |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | Latest |
| **AI** | Google Gemini 1.5 Pro | Latest |
| **Payments** | Toss Payments SDK | 1.9.2 |
| **State Management** | Zustand | 5.0.9 |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Hosting** | Vercel | - |

### 3. Database Schema

```sql
-- Core Tables
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    companies    │     │  announcements  │     │ business_plans  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ source          │     │ company_id (FK) │
│ name            │     │ source_id       │     │ title           │
│ business_number │     │ title           │     │ content         │
│ industry        │     │ organization    │     │ embedding       │
│ employee_count  │     │ category        │     │ created_at      │
│ location        │     │ support_type    │     └─────────────────┘
│ certifications  │     │ application_end │              │
│ annual_revenue  │     │ embedding       │              │
└─────────────────┘     └─────────────────┘              │
        │                       │                        │
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                          matches                             │
├─────────────────────────────────────────────────────────────┤
│ id (PK) | company_id (FK) | announcement_id (FK)            │
│ business_plan_id (FK) | match_score | analysis (JSONB)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  applications   │     │    payments     │     │  subscriptions  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ match_id (FK)   │     │ user_id (FK)    │     │ user_id (FK)    │
│ user_id (FK)    │     │ amount          │     │ plan            │
│ content         │     │ payment_method  │     │ status          │
│ status          │     │ status          │     │ period_start    │
└─────────────────┘     └─────────────────┘     │ period_end      │
                                                └─────────────────┘
```

### 4. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/announcements` | 공고 검색 | Required |
| `GET` | `/api/announcements/[id]` | 공고 상세 | Required |
| `POST` | `/api/announcements/smes/sync` | SME 동기화 | Admin |
| `GET/POST` | `/api/companies` | 기업 목록/생성 | Required |
| `GET/PUT/DELETE` | `/api/companies/[id]` | 기업 CRUD | Required |
| `POST` | `/api/matching` | AI 매칭 분석 | Required |
| `GET/DELETE` | `/api/matching/[id]` | 매칭 결과 | Required |
| `GET/POST` | `/api/applications` | 지원서 목록/생성 | Required |
| `GET/PUT/DELETE` | `/api/applications/[id]` | 지원서 CRUD | Required |
| `POST` | `/api/applications/[id]/improve` | AI 개선 | Required |
| `GET/POST` | `/api/payments` | 결제 내역/생성 | Required |
| `POST` | `/api/payments/toss/confirm` | Toss 결제 확인 | Required |
| `GET/POST` | `/api/subscriptions` | 구독 관리 | Required |
| `POST` | `/api/subscriptions/cancel` | 구독 취소 | Required |

### 5. Security

| 항목 | 구현 |
|------|------|
| 인증 | Supabase Auth (JWT) |
| 권한 | Row Level Security (RLS) |
| API 보안 | Server-side validation |
| 환경 변수 | .env.local (Git 제외) |
| HTTPS | Vercel 자동 적용 |

### 6. External Integrations

| 서비스 | 용도 | 상태 |
|--------|------|------|
| Google Gemini | AI 분석/생성 | ✅ 연동 완료 |
| 중소벤처24 API | 공고 데이터 | ✅ 연동 완료 |
| Toss Payments | 카드/계좌이체 결제 | ✅ 연동 완료 |
| Supabase | DB + Auth | ✅ 연동 완료 |
| Vercel | 호스팅 + Cron | ✅ 연동 완료 |

### 7. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Payments
TOSS_PAYMENTS_CLIENT_KEY=
TOSS_PAYMENTS_SECRET_KEY=

# External APIs
SMES_API_TOKEN=
```

---

## Project Progress

### Overall Progress: 85%

```
████████████████░░░░ 85%
```

### Feature Completion Status

| Category | Feature | Status | Progress |
|----------|---------|--------|----------|
| **Auth** | 이메일 로그인 | ✅ Done | 100% |
| | Google OAuth | ✅ Done | 100% |
| | 카카오 로그인 | ⏳ Planned | 0% |
| **Profile** | 기업 정보 등록 | ✅ Done | 100% |
| | 온보딩 플로우 | ✅ Done | 100% |
| **Search** | 통합 공고 검색 | ✅ Done | 100% |
| | 필터링 | ✅ Done | 100% |
| | 북마크 | ✅ Done | 100% |
| | SMES API 연동 | ✅ Done | 100% |
| **AI** | 매칭 분석 | ✅ Done | 100% |
| | 지원서 생성 | ✅ Done | 100% |
| | 섹션별 AI 개선 | ✅ Done | 100% |
| **Payment** | Toss Payments | ✅ Done | 100% |
| | 무통장 입금 | ✅ Done | 100% |
| | 카카오페이 | ⏳ Planned | 0% |
| | 네이버페이 | ⏳ Planned | 0% |
| **Subscription** | 구독 관리 | ✅ Done | 100% |
| | 사용량 제한 | ✅ Done | 100% |
| **Admin** | 결제 관리 | ✅ Done | 100% |

### Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| MVP 출시 | 2025-01-10 | ✅ 완료 |
| Pro 플랜 런칭 | 2025-01-12 | ✅ 완료 |
| SMES API 연동 | 2025-01-13 | ✅ 완료 |
| 카카오/네이버 결제 | TBD | ⏳ 예정 |
| 엔터프라이즈 플랜 | TBD | ⏳ 예정 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google AI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/choishiam0906/govhelper.git
cd govhelper

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Execute SQL in Supabase Dashboard → SQL Editor

# Start development server
npm run dev
```

### Environment Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get Google AI API key at [Google AI Studio](https://makersuite.google.com/)
3. Set up Toss Payments at [developers.tosspayments.com](https://developers.tosspayments.com/)

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables in Vercel

Set all environment variables in Vercel Dashboard → Settings → Environment Variables

---

## License

This project is proprietary software. All rights reserved.

---

## Contact

- **Email**: choishiam@gmail.com
- **Website**: [govhelpers.com](https://govhelpers.com)

---

<p align="center">
  Made with ❤️ for Korean SMEs
</p>
