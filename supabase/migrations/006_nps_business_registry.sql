-- 국민연금 사업장 데이터 테이블
-- 데이터 출처: https://www.data.go.kr/data/15083277/fileData.do
-- 월간 업데이트 (매월 26일경)

CREATE TABLE IF NOT EXISTS nps_business_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 핵심 식별 정보
  business_number VARCHAR(10) NOT NULL,        -- 사업자등록번호 (숫자만, 하이픈 제거)
  company_name VARCHAR(255) NOT NULL,          -- 사업장명

  -- 주소 정보
  road_address TEXT,                           -- 도로명주소
  jibun_address TEXT,                          -- 지번주소
  postal_code VARCHAR(10),                     -- 우편번호

  -- 국민연금 가입 정보
  subscriber_count INTEGER DEFAULT 0,          -- 가입자수 (직원수 추정)
  monthly_payment BIGINT DEFAULT 0,            -- 당월고지금액
  new_subscribers INTEGER DEFAULT 0,           -- 신규취득자수
  lost_subscribers INTEGER DEFAULT 0,          -- 상실가입자수

  -- 메타 정보
  data_year_month VARCHAR(6),                  -- 자료생성년월 (YYYYMM)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 인덱스를 위한 제약조건
  CONSTRAINT unique_business_number UNIQUE (business_number)
);

-- 사업자번호 검색 인덱스 (가장 중요)
CREATE INDEX IF NOT EXISTS idx_nps_business_number
ON nps_business_registry (business_number);

-- 회사명 검색 인덱스 (부분 일치 검색용)
CREATE INDEX IF NOT EXISTS idx_nps_company_name
ON nps_business_registry USING gin (company_name gin_trgm_ops);

-- 트리그램 확장 활성화 (유사 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RLS 정책 (공개 데이터이므로 모든 사용자 읽기 허용)
ALTER TABLE nps_business_registry ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용
CREATE POLICY "Anyone can read nps_business_registry"
ON nps_business_registry FOR SELECT
USING (true);

-- 서비스 롤만 쓰기 허용 (데이터 import용)
CREATE POLICY "Service role can insert nps_business_registry"
ON nps_business_registry FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update nps_business_registry"
ON nps_business_registry FOR UPDATE
USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_nps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nps_updated_at
BEFORE UPDATE ON nps_business_registry
FOR EACH ROW
EXECUTE FUNCTION update_nps_updated_at();

-- 사업자번호로 조회하는 함수
CREATE OR REPLACE FUNCTION lookup_business_by_number(p_business_number TEXT)
RETURNS TABLE (
  business_number VARCHAR(10),
  company_name VARCHAR(255),
  road_address TEXT,
  jibun_address TEXT,
  postal_code VARCHAR(10),
  subscriber_count INTEGER,
  data_year_month VARCHAR(6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.business_number,
    n.company_name,
    n.road_address,
    n.jibun_address,
    n.postal_code,
    n.subscriber_count,
    n.data_year_month
  FROM nps_business_registry n
  WHERE n.business_number = REGEXP_REPLACE(p_business_number, '[^0-9]', '', 'g')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE nps_business_registry IS '국민연금 가입 사업장 데이터 (공공데이터포털)';
COMMENT ON COLUMN nps_business_registry.business_number IS '사업자등록번호 (10자리, 하이픈 제거)';
COMMENT ON COLUMN nps_business_registry.subscriber_count IS '국민연금 가입자 수 (직원수 추정치)';
