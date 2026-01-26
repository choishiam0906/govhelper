-- 기업 문서 RAG 시스템
-- 2026-01-26

-- 기업 문서 테이블 (사업계획서 등)
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 파일 정보
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,           -- Storage 경로
  file_size INTEGER,                -- 바이트
  file_type VARCHAR(50) DEFAULT 'application/pdf',

  -- 추출된 텍스트
  extracted_text TEXT,              -- pdf-parse로 추출한 전체 텍스트
  page_count INTEGER,               -- 페이지 수

  -- 처리 상태
  status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,

  -- 메타데이터
  document_type VARCHAR(50) DEFAULT 'business_plan',  -- business_plan, company_intro, etc.

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 문서 청크 테이블 (RAG용)
CREATE TABLE IF NOT EXISTS company_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES company_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 청크 내용
  chunk_index INTEGER NOT NULL,     -- 청크 순서
  chunk_text TEXT NOT NULL,         -- 청크 텍스트 (약 500~1000자)

  -- 벡터 임베딩
  embedding VECTOR(768),            -- Gemini text-embedding-004

  -- 메타데이터
  token_count INTEGER,              -- 토큰 수 (추정)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_company_documents_company ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_status ON company_documents(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON company_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_company ON company_document_chunks(company_id);

-- 벡터 검색 인덱스 (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON company_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS 정책
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_document_chunks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 회사 문서만 접근 가능
CREATE POLICY "Users can view own company documents"
ON company_documents FOR SELECT
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company documents"
ON company_documents FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own company documents"
ON company_documents FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own company documents"
ON company_documents FOR DELETE
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

-- 청크도 동일한 정책 적용
CREATE POLICY "Users can view own document chunks"
ON company_document_chunks FOR SELECT
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own document chunks"
ON company_document_chunks FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own document chunks"
ON company_document_chunks FOR DELETE
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_company_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_company_documents_updated_at
BEFORE UPDATE ON company_documents
FOR EACH ROW
EXECUTE FUNCTION update_company_documents_updated_at();

-- 회사 컨텍스트 RAG 검색 함수
CREATE OR REPLACE FUNCTION search_company_context(
  p_company_id UUID,
  p_query_embedding VECTOR(768),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  chunk_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.chunk_text,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM company_document_chunks c
  WHERE c.company_id = p_company_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
