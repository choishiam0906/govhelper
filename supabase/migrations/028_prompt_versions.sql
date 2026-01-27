-- AI 프롬프트 버전 관리 시스템
-- 프롬프트 버전별 A/B 테스트 및 성능 추적 기능

-- 프롬프트 버전 테이블
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프롬프트 정보
  prompt_type TEXT NOT NULL,  -- matching_analysis, eligibility_parsing, application_section 등
  version TEXT NOT NULL,      -- v1, v2, v3 등
  content TEXT NOT NULL,      -- 프롬프트 내용 (템플릿 또는 함수)

  -- 활성화 및 가중치
  is_active BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 50,  -- A/B 테스트용 가중치 (0-100)

  -- 메타정보
  description TEXT,           -- 버전 설명
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 유니크 제약: 프롬프트 타입별 버전 중복 방지
  UNIQUE(prompt_type, version)
);

-- 프롬프트 사용 로그 테이블
CREATE TABLE IF NOT EXISTS prompt_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프롬프트 버전 참조
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,

  -- 사용자 정보
  user_id UUID REFERENCES auth.users(id),

  -- 성능 메트릭
  result_score FLOAT,         -- 결과 점수 (0-100)
  response_time INTEGER,      -- 응답 시간 (밀리초)
  error_message TEXT,         -- 에러 메시지 (있을 경우)

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_prompt_versions_type ON prompt_versions(prompt_type);
CREATE INDEX idx_prompt_versions_active ON prompt_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_prompt_usage_logs_version ON prompt_usage_logs(prompt_version_id);
CREATE INDEX idx_prompt_usage_logs_created ON prompt_usage_logs(created_at DESC);

-- RLS 정책 설정
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_usage_logs ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 활성 프롬프트 버전 조회 가능
CREATE POLICY "모든 사용자 프롬프트 조회 가능"
ON prompt_versions
FOR SELECT
TO authenticated
USING (true);

-- 인증된 사용자가 프롬프트 생성/수정 가능 (API에서 관리자 체크)
CREATE POLICY "인증된 사용자 프롬프트 관리 가능"
ON prompt_versions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 사용 로그 기록 가능
CREATE POLICY "사용 로그 기록 가능"
ON prompt_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 사용 로그 조회 가능
CREATE POLICY "사용 로그 조회 가능"
ON prompt_usage_logs
FOR SELECT
TO authenticated
USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_prompt_version_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prompt_version_updated_at
BEFORE UPDATE ON prompt_versions
FOR EACH ROW
EXECUTE FUNCTION update_prompt_version_updated_at();

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

-- 코멘트 추가
COMMENT ON TABLE prompt_versions IS 'AI 프롬프트 버전 관리 테이블';
COMMENT ON TABLE prompt_usage_logs IS 'AI 프롬프트 사용 로그 및 성능 메트릭';
COMMENT ON COLUMN prompt_versions.weight IS 'A/B 테스트용 가중치 (0-100, 높을수록 선택 확률 증가)';
COMMENT ON COLUMN prompt_usage_logs.result_score IS '매칭 점수, 파싱 정확도 등 결과 품질 지표';
COMMENT ON COLUMN prompt_usage_logs.response_time IS 'AI 응답 시간 (밀리초)';
