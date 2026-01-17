# Check 스킬

프로젝트 상태를 점검합니다.

## 사용법

```
/check          # 전체 점검
/check build    # 빌드만 점검
/check lint     # 린트만 점검
/check types    # 타입 체크만
```

## 점검 항목

### 1. 빌드 점검
```bash
npm run build
```

### 2. 린트 점검
```bash
npm run lint
```

### 3. 타입 체크
```bash
npx tsc --noEmit
```

### 4. 의존성 취약점
```bash
npm audit
```

### 5. 환경 변수 확인
필수 환경 변수:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_GENERATIVE_AI_API_KEY
- TOSS_PAYMENTS_CLIENT_KEY
- TOSS_PAYMENTS_SECRET_KEY

## 결과 리포트

점검 결과를 요약하여 보고합니다:
- ✅ 통과 항목
- ❌ 실패 항목 및 해결 방법
