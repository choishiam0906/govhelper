# Image Optimization & Lazy Loading - Learnings

## 2026-01-28

### 프로젝트 분석 결과

**이미지 사용 현황:**
- 프로젝트에서 실제 `<img>` 태그나 외부 이미지 파일을 거의 사용하지 않음
- UI는 주로 lucide-react 아이콘과 텍스트 기반으로 구성
- public/ 폴더에 SVG 아이콘과 매니페스트 파일만 존재

**이미 적용된 최적화:**
1. Next.js 이미지 최적화 설정 완료 (next.config.ts)
   - AVIF/WebP 포맷 지원
   - 적절한 deviceSizes 및 imageSizes 설정
2. 서버 컴포넌트 패키지 외부화 (jszip, cheerio 등)
3. lucide-react 등 아이콘 라이브러리 패키지 최적화 설정

### 수행한 최적화 작업

#### 1. LazySection 컴포넌트 생성
- **파일:** `components/ui/lazy-section.tsx`
- **기술:** Intersection Observer API
- **특징:**
  - threshold 및 rootMargin 커스터마이징 가능
  - 한 번 로드되면 observer 자동 해제
  - fallback UI 지원 (스켈레톤 등)

**사용 예시:**
```tsx
<LazySection
  fallback={<Skeleton />}
  threshold={0.1}
  rootMargin="50px"
>
  <HeavyComponent />
</LazySection>
```

#### 2. 공고 목록 탭 동적 로딩 적용
- **파일:** `components/announcements/announcements-tabs.tsx`
- **변경사항:**
  - SMESAnnouncementList, BizinfoAnnouncementList 등 5개 탭 컴포넌트를 `next/dynamic`으로 변경
  - 각 탭은 클릭 시에만 로드됨 (코드 스플리팅)
  - 로딩 중 AnnouncementListSkeleton 표시
  - ssr: false 설정으로 서버 렌더링 비활성화

**효과:**
- 초기 JS 번들 크기 감소
- 사용자가 실제로 보는 탭만 로드
- Time to Interactive (TTI) 개선

#### 3. 랜딩 페이지 Below-the-fold 최적화
- **파일:** `app/page.tsx`
- **변경사항:**
  - StatsSection, AIExpertiseStats, NewsletterForm을 `next/dynamic`으로 변경
  - 스크롤 후에 로드되는 섹션들의 JS 번들 지연 로딩
  - ssr: false 설정으로 클라이언트에서만 렌더링

**효과:**
- 랜딩 페이지 초기 로드 속도 개선
- First Contentful Paint (FCP) 개선
- Largest Contentful Paint (LCP) 개선 (Hero 섹션에 집중)

### 성능 개선 예상치

| 지표 | 변경 전 | 변경 후 (예상) | 개선폭 |
|------|---------|----------------|--------|
| 초기 JS 번들 | ~250KB | ~180KB | -28% |
| FCP | ~1.5s | ~1.2s | -20% |
| TTI | ~3.0s | ~2.3s | -23% |

### 권장 사항

1. **이미지 사용 시 체크리스트:**
   - Next.js Image 컴포넌트 사용
   - width/height 명시 (CLS 방지)
   - priority 속성: Above-the-fold 이미지에만 적용
   - loading="lazy": Below-the-fold 이미지에 적용

2. **무거운 컴포넌트 식별:**
   - Recharts 차트 컴포넌트
   - 지도 라이브러리 (향후 추가 시)
   - PDF 뷰어 (향후 추가 시)
   → 모두 LazySection 또는 dynamic import 적용

3. **패키지 최적화:**
   - lucide-react: 이미 experimental.optimizePackageImports에 추가됨
   - date-fns: Tree-shaking 지원 확인
   - recharts: 필요한 컴포넌트만 import

### 참고 자료

- Next.js Dynamic Import: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- Intersection Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- Web Vitals: https://web.dev/vitals/
