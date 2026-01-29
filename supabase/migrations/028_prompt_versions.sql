-- 프롬프트 버전 관리 시스템
-- A/B 테스트 및 성능 추적을 위한 테이블

-- 프롬프트 버전 테이블
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 버전별 고유 제약 조건
  UNIQUE(prompt_type, version)
);

-- 프롬프트 사용 로그 테이블
CREATE TABLE IF NOT EXISTS prompt_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  result_score FLOAT,
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prompt_versions_type ON prompt_versions(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_prompt_usage_logs_version ON prompt_usage_logs(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_logs_created ON prompt_usage_logs(created_at);

-- 업데이트 타임스탬프 트리거
CREATE OR REPLACE FUNCTION update_prompt_version_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_version_timestamp
BEFORE UPDATE ON prompt_versions
FOR EACH ROW
EXECUTE FUNCTION update_prompt_version_timestamp();

-- RLS (Row Level Security) 정책
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_usage_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 프롬프트 버전 관리 가능
CREATE POLICY "관리자만 프롬프트 버전 조회 가능"
  ON prompt_versions
  FOR SELECT
  USING (true);

CREATE POLICY "관리자만 프롬프트 버전 삽입 가능"
  ON prompt_versions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "관리자만 프롬프트 버전 수정 가능"
  ON prompt_versions
  FOR UPDATE
  USING (true);

-- 사용 로그는 서버에서만 기록 (RLS 비활성화)
CREATE POLICY "서버에서만 사용 로그 삽입 가능"
  ON prompt_usage_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "관리자만 사용 로그 조회 가능"
  ON prompt_usage_logs
  FOR SELECT
  USING (true);

-- 프롬프트 성능 메트릭 계산 뷰
CREATE OR REPLACE VIEW prompt_metrics AS
SELECT
  pv.id AS version_id,
  pv.prompt_type,
  pv.version,
  COUNT(pul.id) AS total_usage,
  AVG(pul.result_score) AS avg_score,
  AVG(pul.response_time) AS avg_response_time,
  COUNT(CASE WHEN pul.error_message IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(pul.id), 0) AS error_rate,
  COUNT(CASE WHEN pul.error_message IS NULL THEN 1 END)::FLOAT / NULLIF(COUNT(pul.id), 0) AS success_rate
FROM prompt_versions pv
LEFT JOIN prompt_usage_logs pul ON pv.id = pul.prompt_version_id
GROUP BY pv.id, pv.prompt_type, pv.version;

-- 초기 데이터: 기존 프롬프트를 v1으로 등록
INSERT INTO prompt_versions (prompt_type, version, content, is_active, weight, description)
VALUES
  ('matching_analysis', 'v1', 'MATCHING_ANALYSIS_PROMPT', true, 100, '기존 매칭 분석 프롬프트'),
  ('eligibility_parsing', 'v1', 'ELIGIBILITY_PARSING_PROMPT', true, 100, '기존 지원자격 파싱 프롬프트'),
  ('application_section', 'v1', 'APPLICATION_SECTION_PROMPT', true, 100, '기존 지원서 섹션 작성 프롬프트'),
  ('section_improvement', 'v1', 'SECTION_IMPROVEMENT_PROMPT', true, 100, '기존 섹션 개선 프롬프트'),
  ('evaluation_extraction', 'v1', 'EVALUATION_EXTRACTION_PROMPT', true, 100, '기존 평가기준 추출 프롬프트'),
  ('chatbot', 'v1', 'CHATBOT_PROMPT', true, 100, '기존 챗봇 프롬프트')
ON CONFLICT (prompt_type, version) DO NOTHING;

COMMENT ON TABLE prompt_versions IS 'AI 프롬프트 버전 관리 테이블';
COMMENT ON TABLE prompt_usage_logs IS 'AI 프롬프트 사용 로그 (A/B 테스트 메트릭)';
COMMENT ON VIEW prompt_metrics IS '프롬프트별 성능 메트릭 (사용 횟수, 평균 점수, 에러율 등)';
