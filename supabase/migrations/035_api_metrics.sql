-- API 성능 메트릭 테이블
-- API 응답 시간 및 상태 코드 추적
CREATE TABLE api_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,          -- /api/announcements 등
  method TEXT NOT NULL,            -- GET, POST 등
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,    -- 응답 시간 (ms)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 최근 데이터 조회용 인덱스
CREATE INDEX idx_api_metrics_created_at ON api_metrics(created_at DESC);
CREATE INDEX idx_api_metrics_endpoint ON api_metrics(endpoint, created_at DESC);

-- RLS: 관리자만 조회 가능
ALTER TABLE api_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 api_metrics 조회" ON api_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role은 RLS 무시하므로 INSERT 정책 불필요
-- 메트릭 수집은 service role key로 처리됨
