-- 동기화 로그 테이블 생성
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,           -- smes, bizinfo, kstartup, g2b
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',  -- running, success, failed
  total_fetched INTEGER DEFAULT 0,
  new_added INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- RLS 정책 설정 (관리자만 접근 가능)
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 관리자 읽기 권한
CREATE POLICY "관리자만 sync_logs 조회 가능" ON sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 관리자 삽입 권한
CREATE POLICY "관리자만 sync_logs 생성 가능" ON sync_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 관리자 업데이트 권한
CREATE POLICY "관리자만 sync_logs 수정 가능" ON sync_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 코멘트 추가
COMMENT ON TABLE sync_logs IS '동기화 작업 로그 테이블';
COMMENT ON COLUMN sync_logs.source IS '데이터 소스 (smes, bizinfo, kstartup, g2b)';
COMMENT ON COLUMN sync_logs.status IS '동기화 상태 (running, success, failed)';
COMMENT ON COLUMN sync_logs.total_fetched IS '전체 가져온 건수';
COMMENT ON COLUMN sync_logs.new_added IS '신규 추가된 건수';
COMMENT ON COLUMN sync_logs.updated IS '업데이트된 건수';
COMMENT ON COLUMN sync_logs.failed IS '실패한 건수';
