-- 기업 인증 정보 테이블 (벤처인증, 이노비즈, 메인비즈 등)
-- Migration: 014_company_certifications
-- Created: 2026-01-24

-- 기업 인증 정보 테이블
CREATE TABLE IF NOT EXISTS company_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_number VARCHAR(12) NOT NULL,
  company_name VARCHAR(255),
  cert_type VARCHAR(50) NOT NULL,
  cert_name VARCHAR(100) NOT NULL,
  cert_number VARCHAR(100),
  issued_date DATE,
  expiry_date DATE,
  is_valid BOOLEAN DEFAULT true,
  issuing_org VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(business_number, cert_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_certs_business_number ON company_certifications(business_number);
CREATE INDEX IF NOT EXISTS idx_certs_type ON company_certifications(cert_type);
CREATE INDEX IF NOT EXISTS idx_certs_valid ON company_certifications(is_valid) WHERE is_valid = true;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_company_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_certifications_updated_at
  BEFORE UPDATE ON company_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_company_certifications_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE company_certifications IS '기업 인증 정보 (벤처인증, 이노비즈, 메인비즈 등)';
COMMENT ON COLUMN company_certifications.cert_type IS '인증 타입 (venture, innobiz, mainbiz, greencompany, familyfriendly, socialenterprise, womenbiz)';
COMMENT ON COLUMN company_certifications.is_valid IS '현재 유효 여부 (만료일 기준 자동 계산 가능)';

-- RLS (Row Level Security) 활성화
ALTER TABLE company_certifications ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view certifications"
  ON company_certifications
  FOR SELECT
  USING (true);

-- 관리자만 수정 가능 (향후 추가)
-- CREATE POLICY "Admins can manage certifications"
--   ON company_certifications
--   FOR ALL
--   USING (auth.jwt() ->> 'email' IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))));
