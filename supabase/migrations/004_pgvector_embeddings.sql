-- pgvector 확장 활성화
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 공고 임베딩 저장 테이블 생성
-- Gemini text-embedding-004 모델은 768차원 벡터 생성
CREATE TABLE IF NOT EXISTS announcement_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  embedding vector(768),  -- Gemini embedding 차원
  content_hash TEXT,      -- 내용 변경 감지용 해시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id)
);

-- 3. 벡터 검색을 위한 인덱스 생성 (IVFFlat - 빠른 근사 검색)
-- lists 파라미터: sqrt(행 수) 권장, 공고 1000개 기준 약 32
CREATE INDEX IF NOT EXISTS announcement_embeddings_vector_idx
ON announcement_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- 4. announcement_id 인덱스
CREATE INDEX IF NOT EXISTS announcement_embeddings_announcement_id_idx
ON announcement_embeddings(announcement_id);

-- 5. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_embedding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcement_embeddings_updated_at
  BEFORE UPDATE ON announcement_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embedding_updated_at();

-- 6. 시맨틱 검색 함수 생성
CREATE OR REPLACE FUNCTION search_announcements_by_embedding(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  organization TEXT,
  category TEXT,
  support_type TEXT,
  support_amount TEXT,
  application_end DATE,
  source TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.organization,
    a.category,
    a.support_type,
    a.support_amount,
    a.application_end,
    a.source,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM announcement_embeddings ae
  JOIN announcements a ON a.id = ae.announcement_id
  WHERE 1 - (ae.embedding <=> query_embedding) > match_threshold
    AND a.status = 'active'
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. RLS 정책 (인증된 사용자만 조회 가능)
ALTER TABLE announcement_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view embeddings"
ON announcement_embeddings FOR SELECT
TO authenticated
USING (true);

-- 관리자/서비스 역할만 INSERT/UPDATE/DELETE 가능
CREATE POLICY "Service role can manage embeddings"
ON announcement_embeddings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. 통계 확인용 뷰
CREATE OR REPLACE VIEW embedding_stats AS
SELECT
  COUNT(*) as total_embeddings,
  COUNT(DISTINCT announcement_id) as unique_announcements,
  MIN(created_at) as first_embedding,
  MAX(updated_at) as last_update
FROM announcement_embeddings;
