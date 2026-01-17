# DB 스킬

Supabase 데이터베이스 마이그레이션 및 관리 작업을 수행합니다.

## 사용법

```
/db migrate     # 마이그레이션 실행
/db seed        # 시드 데이터 삽입
/db reset       # 데이터베이스 리셋 (주의!)
```

## 마이그레이션 파일 위치

```
supabase/migrations/
```

## 마이그레이션 작성

1. 새 마이그레이션 파일 생성:
```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

2. SQL 작성:
```sql
-- 테이블 생성 예시
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 추가
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);
```

3. Supabase Dashboard → SQL Editor에서 실행

## 주요 테이블

- `companies` - 기업 정보
- `announcements` - 공고
- `matches` - AI 매칭 결과
- `applications` - 지원서
- `payments` - 결제 내역
- `subscriptions` - 구독

## 백업

Supabase Dashboard → Database → Backups에서 수동 백업 가능
