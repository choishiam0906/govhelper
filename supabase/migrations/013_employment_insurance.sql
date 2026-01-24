-- 고용보험 사업장 정보 테이블 생성
-- 사업자번호로 고용보험 가입 현황 조회 (직원수, 사업장 상태 파악)

-- 기존 테이블 존재 시 삭제 (개발용)
-- DROP TABLE IF EXISTS employment_insurance CASCADE;

-- 고용보험 테이블 생성
CREATE TABLE IF NOT EXISTS employment_insurance (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_number VARCHAR(12) NOT NULL,           -- 사업자번호 (하이픈 제거)
  company_name VARCHAR(255),                      -- 사업장명
  business_type VARCHAR(100),                     -- 사업장 업종
  
  -- 고용보험 정보
  total_insured INTEGER DEFAULT 0,                -- 고용보험 가입자 수
  join_date DATE,                                 -- 가입일
  status VARCHAR(20) DEFAULT 'active',            -- 상태: active, inactive
  
  -- 추가 정보
  address TEXT,                                   -- 사업장 주소
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 유니크 제약
  UNIQUE(business_number)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ei_business_number ON employment_insurance(business_number);
CREATE INDEX IF NOT EXISTS idx_ei_company_name ON employment_insurance USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ei_status ON employment_insurance(status);
CREATE INDEX IF NOT EXISTS idx_ei_business_type ON employment_insurance(business_type);

-- pg_trgm 확장 활성화 (회사명 유사 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RLS (Row Level Security) 설정
ALTER TABLE employment_insurance ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view employment insurance data"
  ON employment_insurance
  FOR SELECT
  USING (true);

-- 관리자만 수정 가능 (service_role 사용)
-- Supabase Admin 권한으로만 INSERT/UPDATE/DELETE 가능

-- 코멘트 추가
COMMENT ON TABLE employment_insurance IS '고용보험 가입 사업장 정보 테이블';
COMMENT ON COLUMN employment_insurance.business_number IS '사업자등록번호 (하이픈 제거, 10자리)';
COMMENT ON COLUMN employment_insurance.company_name IS '사업장명';
COMMENT ON COLUMN employment_insurance.business_type IS '사업장 업종 (예: 정보통신업)';
COMMENT ON COLUMN employment_insurance.total_insured IS '고용보험 가입자 수 (직원 수 추정)';
COMMENT ON COLUMN employment_insurance.join_date IS '고용보험 가입일';
COMMENT ON COLUMN employment_insurance.status IS '사업장 상태 (active: 운영중, inactive: 폐업)';

-- 샘플 데이터 (테스트용)
-- INSERT INTO employment_insurance (business_number, company_name, business_type, total_insured, join_date, status, address)
-- VALUES
--   ('1234567890', '(주)테스트기업', '정보통신업', 50, '2020-01-15', 'active', '서울특별시 강남구 테헤란로 123'),
--   ('9876543210', '테스트스타트업', '소프트웨어 개발', 15, '2022-06-01', 'active', '서울특별시 서초구 서초대로 456'),
--   ('1111222233', '샘플주식회사', '제조업', 120, '2015-03-10', 'active', '경기도 성남시 분당구 판교로 789');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_employment_insurance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employment_insurance_updated_at
  BEFORE UPDATE ON employment_insurance
  FOR EACH ROW
  EXECUTE FUNCTION update_employment_insurance_updated_at();
