# Sync 스킬

정부 지원사업 공고 데이터를 동기화합니다.

## 사용법

```
/sync           # 전체 동기화 (SMES + 기업마당 + K-Startup)
/sync smes      # 중소벤처24만 동기화
/sync bizinfo   # 기업마당만 동기화
/sync kstartup  # K-Startup만 동기화
```

## API 엔드포인트

| 소스 | 엔드포인트 |
|------|-----------|
| 중소벤처24 | `POST /api/announcements/smes/sync` |
| 기업마당 | `POST /api/announcements/bizinfo/sync` |
| K-Startup | `POST /api/announcements/kstartup/sync` |

## 수동 동기화

cURL로 직접 호출:
```bash
# 중소벤처24
curl -X POST https://govhelpers.com/api/announcements/smes/sync

# 기업마당
curl -X POST https://govhelpers.com/api/announcements/bizinfo/sync

# K-Startup
curl -X POST https://govhelpers.com/api/announcements/kstartup/sync
```

## Vercel Cron 설정

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/announcements/smes/sync", "schedule": "0 0 * * *" },
    { "path": "/api/announcements/bizinfo/sync", "schedule": "0 1 * * *" },
    { "path": "/api/announcements/kstartup/sync", "schedule": "0 2 * * *" }
  ]
}
```

## 동기화 로직

1. 외부 API에서 공고 목록 조회
2. 기존 공고와 비교 (source + source_id 기준)
3. 신규 공고 INSERT, 기존 공고 UPDATE
4. 마감된 공고 상태를 `expired`로 업데이트

## 필수 환경 변수

| 변수명 | 설명 | 발급처 |
|--------|------|--------|
| SMES_API_TOKEN | 중소벤처24 API 토큰 | 중소벤처24 |
| BIZINFO_API_KEY | 기업마당 API 인증키 | 기업마당 |
| KSTARTUP_API_KEY | K-Startup API 키 | 공공데이터포털 |
