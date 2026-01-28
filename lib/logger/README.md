# Structured Logging System

GovHelper의 구조화된 로깅 시스템입니다. JSON 형식으로 로그를 출력하여 추적 및 분석이 용이합니다.

## 주요 기능

- **JSON 포맷**: 구조화된 로그 출력
- **Trace ID**: 요청별 추적 ID (UUID v4)
- **Module Tag**: 모듈/파일별 로그 분류
- **환경별 로그 레벨**:
  - Production: `info`, `warn`, `error`만 출력
  - Development: 모든 레벨 출력 (`debug` 포함)

## 로그 엔트리 구조

```json
{
  "timestamp": "2026-01-28T12:00:00.000Z",
  "level": "info",
  "message": "SMES 동기화 시작",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "module": "smes-sync",
  "metadata": {
    "count": 100,
    "duration": "1500ms"
  }
}
```

## 사용 방법

### 기본 사용

```typescript
import { logger } from '@/lib/logger'

logger.info('서버 시작')
logger.warn('메모리 부족', { usage: '85%' })
logger.error('DB 연결 실패', { error: err.message })
logger.debug('변수 값', { userId: '123', status: 'active' })
```

### Request Logger (권장)

API Route에서 traceId를 자동으로 추가:

```typescript
import { createRequestLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request, 'smes-sync')

  log.info('동기화 시작')
  log.debug('API 호출', { url: apiUrl })
  log.error('동기화 실패', { error: err.message })

  return NextResponse.json({ success: true })
}
```

### Child Logger

모듈별 로거 생성:

```typescript
import { logger } from '@/lib/logger'

const syncLogger = logger.child({ module: 'sync' })
syncLogger.info('동기화 시작')

const dbLogger = logger.child({ module: 'database' })
dbLogger.warn('슬로우 쿼리', { duration: '5s' })
```

## 로그 레벨

| 레벨 | 용도 | Production |
|------|------|------------|
| `debug` | 디버깅 정보 (변수값, 흐름) | ❌ 출력 안 됨 |
| `info` | 일반 정보 (시작/완료, 통계) | ✅ 출력 |
| `warn` | 경고 (복구 가능한 오류) | ✅ 출력 |
| `error` | 에러 (복구 불가능한 오류) | ✅ 출력 |

## Trace ID 전파

클라이언트에서 `x-trace-id` 헤더를 전송하면 동일한 Trace ID 사용:

```typescript
fetch('/api/sync', {
  headers: {
    'x-trace-id': 'existing-trace-id'
  }
})
```

## 적용된 파일

- `app/api/announcements/smes/sync/route.ts`
- `app/api/announcements/bizinfo/sync/route.ts`
- `app/api/matching/route.ts`
- `app/api/payments/toss/confirm/route.ts`

## 로그 예시

### 성공 케이스

```json
{"timestamp":"2026-01-28T12:00:00.000Z","level":"info","message":"SMES 동기화 시작","traceId":"550e8400-e29b-41d4-a716-446655440000","module":"smes-sync"}
{"timestamp":"2026-01-28T12:00:01.000Z","level":"info","message":"SMES API 데이터 조회 완료","traceId":"550e8400-e29b-41d4-a716-446655440000","module":"smes-sync","metadata":{"count":100}}
{"timestamp":"2026-01-28T12:00:05.000Z","level":"info","message":"SMES 동기화 완료","traceId":"550e8400-e29b-41d4-a716-446655440000","module":"smes-sync","metadata":{"duration":"5000ms","upserted":50}}
```

### 에러 케이스

```json
{"timestamp":"2026-01-28T12:00:00.000Z","level":"error","message":"SMES API 호출 실패","traceId":"550e8400-e29b-41d4-a716-446655440000","module":"smes-sync","metadata":{"status":500,"url":"https://api.smes.go.kr"}}
```

## 로그 모니터링

Vercel 로그 뷰어에서 JSON 필터링:

```bash
# Trace ID로 요청 추적
grep "550e8400-e29b-41d4-a716-446655440000"

# 에러 로그만 필터링
jq 'select(.level=="error")'

# 특정 모듈 로그
jq 'select(.module=="smes-sync")'
```

## 주의사항

1. **Production에서 console.log 사용 금지**: 반드시 logger 사용
2. **민감 정보 로깅 금지**: 비밀번호, API 키, 개인정보 제외
3. **적절한 로그 레벨 선택**:
   - 디버깅 정보는 `debug`
   - 비즈니스 이벤트는 `info`
   - 예상치 못한 상황은 `warn`
   - 시스템 장애는 `error`
