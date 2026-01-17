# CLAUDE.md - GovHelper 프로젝트 가이드

이 파일은 Claude Code가 GovHelper 프로젝트 컨텍스트를 이해하고 효율적으로 작업하도록 안내합니다.

---

## 프로젝트 개요

**GovHelper**는 중소기업과 스타트업을 위한 AI 기반 정부지원사업 매칭 및 지원서 작성 도우미 SaaS 플랫폼입니다.

| 항목 | 내용 |
|------|------|
| **라이브 URL** | https://govhelpers.com |
| **GitHub** | https://github.com/choishiam0906/govhelper |
| **진행도** | 85% 완성 |
| **상태** | 프로덕션 운영 중 |

---

## 핵심 기능

- **통합 공고 검색**: 중소벤처24, 나라장터, 기업마당, K-Startup 공고 통합
- **AI 매칭 분석**: 기업 정보 기반 0-100점 매칭 점수 제공
- **AI 지원서 작성**: 지원서 초안 자동 생성 및 섹션별 개선
- **결제/구독**: Toss Payments 연동, Free/Pro 플랜

---

## 기술 스택

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **Frontend** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI + Shadcn | Latest |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | Latest |
| **AI** | Google Gemini 1.5 Pro | Latest |
| **Payments** | Toss Payments SDK | 1.9.2 |
| **State** | Zustand | 5.0.9 |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Email** | Resend | 6.7.0 |
| **Hosting** | Vercel | - |

---

## 디렉토리 구조

```
govhelper-main/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 페이지 (로그인, 회원가입)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # 대시보드 페이지
│   │   ├── dashboard/
│   │   │   ├── announcements/    # 공고 검색/상세
│   │   │   ├── matching/         # AI 매칭
│   │   │   ├── applications/     # 지원서 관리
│   │   │   ├── billing/          # 결제/구독
│   │   │   └── profile/          # 기업 프로필
│   │   └── onboarding/           # 온보딩
│   ├── admin/                    # 관리자 페이지
│   │   ├── users/
│   │   └── payments/
│   ├── api/                      # API Routes
│   │   ├── announcements/
│   │   ├── companies/
│   │   ├── matching/
│   │   ├── applications/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   └── business/             # 사업자 검증
│   ├── layout.tsx
│   └── page.tsx                  # 랜딩 페이지
├── components/                   # 공통 컴포넌트
│   ├── ui/                       # Shadcn UI 컴포넌트
│   └── ...
├── lib/                          # 유틸리티 및 설정
│   ├── ai/                       # Gemini AI 로직
│   ├── email/                    # Resend 이메일
│   ├── payments/                 # Toss Payments
│   ├── queries/                  # Supabase 쿼리
│   └── supabase/                 # Supabase 클라이언트
├── types/                        # TypeScript 타입 정의
├── supabase/
│   └── migrations/               # DB 마이그레이션
├── scripts/                      # 유틸리티 스크립트
└── public/                       # 정적 파일
```

---

## API 엔드포인트

### 공고 (Announcements)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/announcements` | 공고 검색 (필터링, 페이지네이션) |
| `GET` | `/api/announcements/[id]` | 공고 상세 |
| `POST` | `/api/announcements/smes/sync` | SMES 공고 동기화 (Cron) |

### 기업 (Companies)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/companies` | 기업 목록/생성 |
| `GET/PUT/DELETE` | `/api/companies/[id]` | 기업 CRUD |

### AI 매칭 (Matching)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matching` | AI 매칭 분석 요청 |
| `GET/DELETE` | `/api/matching/[id]` | 매칭 결과 조회/삭제 |

### 지원서 (Applications)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/applications` | 지원서 목록/생성 |
| `GET/PUT/DELETE` | `/api/applications/[id]` | 지원서 CRUD |
| `POST` | `/api/applications/[id]/improve` | AI 섹션 개선 |

### 결제/구독 (Payments & Subscriptions)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/toss/confirm` | Toss 결제 확인 |
| `GET/POST` | `/api/subscriptions` | 구독 관리 |
| `POST` | `/api/subscriptions/cancel` | 구독 취소 |

### 사업자 검증
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/business/verify` | 국세청 사업자등록정보 검증 |

---

## 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Payments (Toss)
TOSS_PAYMENTS_CLIENT_KEY=
TOSS_PAYMENTS_SECRET_KEY=

# External APIs
SMES_API_TOKEN=           # 중소벤처24 API
NTS_API_KEY=              # 국세청 사업자등록정보

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://govhelpers.com
ADMIN_EMAILS=             # 쉼표로 구분된 관리자 이메일
```

---

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 프로덕션 시작
npm run start

# 린트
npm run lint
```

---

## 코드 컨벤션

### UX 라이팅 (토스 스타일)
- 모든 문구는 **해요체** 사용
- 능동형 표현: "저장됐어요" → "저장했어요"
- 긍정형 표현: "없어요" → "있어요"
- "돼요" 통일: "되어요" → "돼요"

### 접근성 (A11y)
- 버튼/링크에 명확한 레이블 제공
- 이미지에 alt 텍스트 필수
- 키보드 네비게이션 지원

### 다크패턴 방지
- 숨겨진 비용 금지
- 취소/해지 버튼 명확히 표시
- 긴급성 압박 금지

### 커밋 메시지
- 한글 자유 형식
- 예시: `로그인 기능 추가`, `버그 수정: 결제 오류 해결`

---

## 데이터베이스 스키마

### 주요 테이블
- `companies`: 기업 정보
- `announcements`: 정부지원사업 공고
- `matches`: AI 매칭 결과
- `applications`: 지원서
- `payments`: 결제 내역
- `subscriptions`: 구독 정보

### RLS (Row Level Security)
모든 테이블에 RLS 적용됨. 사용자는 자신의 데이터만 접근 가능.

---

## 외부 API 연동 현황

| API | 용도 | 상태 |
|-----|------|------|
| 중소벤처24 (SMES) | 정부지원사업 공고 | ✅ 완료 |
| 국세청 사업자등록정보 | 사업자번호 검증 | ✅ 완료 |
| Google Gemini | AI 분석/생성 | ✅ 완료 |
| Toss Payments | 결제 | ✅ 완료 |
| Resend | 이메일 알림 | ✅ 완료 |

---

## 진행 예정 작업

### P0 - 즉시
- [ ] 다크패턴 방지 점검
- [ ] 반응형 디자인 점검 (375px)
- [ ] 에러 핸들링 개선

### P1 - 단기
- [ ] LLM 응답 스트리밍 (SSE)
- [ ] PDF 다운로드
- [ ] Rate Limiting

### P2 - 중기
- [ ] 카카오 로그인/페이
- [ ] RAG 검색 엔진 (pgvector)
- [ ] HWP 파일 다운로드

---

## 참고 링크

- [토스 UX 라이팅 가이드](https://toss.im/career/article/toss-product-language)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
