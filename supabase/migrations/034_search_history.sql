-- 검색어 기록 및 인기 검색어 집계용 테이블
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),  -- nullable (비회원도 가능)
  source TEXT DEFAULT 'filter',            -- 'filter' | 'semantic'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_user ON search_queries(user_id) WHERE user_id IS NOT NULL;

-- RLS 활성화
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 검색기록만 조회 가능
CREATE POLICY "사용자는 자신의 검색기록 조회" ON search_queries
  FOR SELECT USING (auth.uid() = user_id);

-- service role은 모든 작업 가능 (INSERT 정책은 별도 불필요, service role이 처리)
