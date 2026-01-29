-- 마이그레이션 실행 이력 추적 테이블
-- 생성일: 2026-01-29

CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ DEFAULT now(),
  checksum TEXT,
  success BOOLEAN DEFAULT true
);

-- exec_sql 함수 (마이그레이션 실행용)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 활성화 (관리용 테이블)
ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY;

-- 서비스 역할만 접근 가능
CREATE POLICY "서비스 역할만 접근" ON _migrations
  FOR ALL USING (auth.role() = 'service_role');
