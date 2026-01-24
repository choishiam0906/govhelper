# Changelog

GovHelper 프로젝트의 모든 주요 변경사항을 기록합니다.

## [1.5.0] - 2026-01-24

### Added
- **나라장터 (G2B) API 연동**: 조달청 입찰공고 동기화 (Cron: 03:00, 15:00 UTC)
- **테스트 커버리지 확대**: 76% 커버리지 달성 (167개 테스트)
  - `__tests__/lib/cache.test.ts` - TTL 정책, 캐시 키 생성 로직
  - `__tests__/lib/recommendations.test.ts` - 업종/지역 매핑, 점수 계산
  - `__tests__/lib/rate-limit.test.ts` - IP 추출, 헤더 생성
  - `__tests__/lib/dashboard.test.ts` - 플랜 정보, 프로모션 로직
- **사용자 피드백 시스템**: 버그 신고, 기능 요청, 일반 의견 수집
  - 플로팅 피드백 버튼 (대시보드 우측 하단)
  - 관리자 피드백 관리 페이지 (`/admin/feedback`)

### Security
- **보안 감사 및 취약점 수정**: 코드베이스 전체 보안 점검
  - [Critical] DART API 키 하드코딩 제거 (`scripts/import-dart-companies.ts`)
  - [Medium] Supabase 프로젝트 ID 노출 제거 (`scripts/run-migration-007.ts`)
  - [Medium] `supabase/.temp/` 폴더 Git 추적 해제 및 `.gitignore` 추가
  - 클라이언트 코드 민감 정보 노출 없음 확인

### Removed
- **HRD Korea API 제거**: 개인 직업훈련 대상으로 창업자 플랫폼에 부적합
  - `app/api/announcements/hrd/*` 삭제
  - `components/announcements/hrd-announcement-list.tsx` 삭제

## [1.4.0] - 2026-01-23

### Added
- **사업자번호 조회 시 폼 자동 입력**: NPS/DART 데이터 기반 기업정보 자동 채우기
  - 적용 페이지: `/try`, `/onboarding`, `/dashboard/profile`
  - 자동 입력 필드: 기업명, 직원수, 설립일, 지역, 업종
- **Pro/Premium 맞춤 추천 공고**: 기업 정보 기반 적합 공고 자동 추천
  - 100점 만점 추천 알고리즘 (업종 30, 지역 20, 직원수 15, 매출 15, 업력 10, 인증 10)
  - API: `GET /api/recommendations`
- **관리자 사용자 관리 개선**: Pro/Premium 업그레이드/다운그레이드 기능

### Changed
- 구독 관리 로직 개선 (기존 기간 유지 옵션 추가)

## [1.3.0] - 2026-01-22

### Added
- **DART (전자공시) 데이터 연동**: 115,051개 상장/비상장 기업 정보
  - 제공 정보: 회사명, 업종, 대표자, 설립일, 주소, 홈페이지, 상장상태
  - 마이그레이션: `009_dart_company_data.sql`
- **통합 기업정보 조회 시스템**: NTS + NPS + DART 데이터 통합
  - API: `POST /api/business/unified-lookup`
  - React Hook: `useBusinessLookup()`
- **시스템 고도화 4주 계획 완료**
  - Week 1: Redis 캐싱 인프라 구축
  - Week 2: RAG 검색 최적화 (임베딩/매칭 캐싱)
  - Week 3: 매칭 정확도 개선 (Few-shot 프롬프트)
  - Week 4: 데이터 소스 확장 (고용보험, 벤처인증)

### Changed
- 회사명 정규화 유틸리티 추가 (`lib/business/utils/company-name.ts`)
- DB 성능 인덱스 추가 (`012_performance_indexes.sql`)

## [1.2.0] - 2026-01-21

### Added
- **비회원 매칭 플로우**: 회원가입 없이 AI 매칭 체험
  - 멀티스텝 폼 (framer-motion)
  - 3~5순위 공개, 1~2순위 블러 처리
  - API: `POST /api/guest/matching`
- **국민연금 사업장 데이터 연동**: 기업정보 자동 조회
  - 마이그레이션: `006_nps_business_registry.sql`
  - import 스크립트: `scripts/import-nps-data.ts`
- **3단계 요금제 개편**: Free/Pro/Premium
  - Free: 공고 검색, AI 시맨틱 검색, AI 매칭 (3~5순위)
  - Pro: ₩5,000/월 - AI 매칭 전체 공개
  - Premium: ₩50,000/월 - AI 지원서 작성

### Changed
- 랜딩 페이지 CTA → `/try` 연결
- 프로모션 코드 비활성화

## [1.1.0] - 2026-01-20

### Added
- **RAG 시맨틱 검색 엔진**: pgvector + Gemini Embedding
  - 768차원 벡터 검색
  - 1,000개 공고 벡터화 완료
  - API: `POST /api/announcements/search`
- **HWPX 파일 다운로드**: 한글 오피스 지원
- **관리자 대시보드 통계 차트**: recharts 시각화
- **정적 페이지**: 이용약관, 개인정보처리방침, 서비스 소개

### Fixed
- 관리자 페이지 사용자 목록 (온보딩 미완료 사용자 포함)
- 랜딩 페이지 404 링크 수정
- Vercel 환경변수 줄바꿈 문제 해결

## [1.0.0] - 2026-01-19

### Added
- **동기화 시 AI 자동 분류**: Gemini AI 지원자격 파싱
- **소스별 탭 내부 상세 페이지 연동**
- **미등록 사업자 승인 프로세스**: 사업계획서 업로드 → 관리자 승인

### Fixed
- Google/카카오 OAuth 리다이렉트 문제
- Vercel 프로젝트 연결 (govhelpers.com)

---

## [0.9.0] - 2026-01-13 ~ 2026-01-18

### Added
- 중소벤처24 (SMES) API 연동
- 기업마당 (bizinfo) API 연동
- K-Startup API 연동
- Rate Limiting (Upstash Redis)
- 이메일 알림 기능 (Resend)
- 첨부파일 스크래핑

---

## [0.1.0] - 2026-01-10 ~ 2026-01-12

### Added
- MVP 출시
- 이메일/비밀번호 로그인
- 기업 프로필 등록
- 공고 검색 및 필터링
- AI 매칭 분석 (Gemini)
- AI 지원서 작성
- Toss Payments 결제
- 구독 관리

---

**Note**: 날짜 형식은 YYYY-MM-DD (ISO 8601)를 따릅니다.
