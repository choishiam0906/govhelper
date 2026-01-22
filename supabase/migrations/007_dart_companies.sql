-- DART 기업 정보 테이블
-- 전자공시시스템(DART)에서 수집한 상장/외감 기업 데이터

-- 기존 nps_business_registry 테이블 삭제 (사용 불가)
DROP TABLE IF EXISTS nps_business_registry;

-- DART 기업 테이블 생성
CREATE TABLE IF NOT EXISTS dart_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- DART 고유 정보
  corp_code VARCHAR(8) NOT NULL,           -- DART 고유번호
  corp_name VARCHAR(255) NOT NULL,         -- 정식명칭
  corp_name_eng VARCHAR(255),              -- 영문명칭
  stock_name VARCHAR(100),                 -- 종목명/약식명칭
  stock_code VARCHAR(10),                  -- 주식 종목코드

  -- 사업자 정보
  business_number VARCHAR(10),             -- 사업자등록번호 (10자리)
  corp_reg_number VARCHAR(13),             -- 법인등록번호

  -- 기업 정보
  ceo_name VARCHAR(100),                   -- 대표자명
  corp_cls VARCHAR(1),                     -- 법인구분 (Y:유가, K:코스닥, N:코넥스, E:기타)
  address TEXT,                            -- 주소
  homepage VARCHAR(255),                   -- 홈페이지
  phone VARCHAR(50),                       -- 전화번호
  fax VARCHAR(50),                         -- 팩스번호
  industry_code VARCHAR(10),               -- 업종코드
  established_date DATE,                   -- 설립일
  accounting_month VARCHAR(2),             -- 결산월

  -- 메타 정보
  data_updated_at TIMESTAMPTZ,             -- DART 데이터 최종 변경일
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 제약조건
  CONSTRAINT unique_corp_code UNIQUE (corp_code),
  CONSTRAINT unique_dart_business_number UNIQUE (business_number)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dart_business_number ON dart_companies (business_number);
CREATE INDEX IF NOT EXISTS idx_dart_corp_name ON dart_companies (corp_name);
CREATE INDEX IF NOT EXISTS idx_dart_stock_code ON dart_companies (stock_code);

-- pg_trgm 확장 활성화 (유사 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 회사명 유사 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_dart_corp_name_trgm ON dart_companies USING gin (corp_name gin_trgm_ops);

-- RLS 활성화
ALTER TABLE dart_companies ENABLE ROW LEVEL SECURITY;

-- RLS 정책 - 모든 사용자 읽기 허용
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dart_companies' AND policyname = 'Anyone can read dart_companies') THEN
    CREATE POLICY "Anyone can read dart_companies" ON dart_companies FOR SELECT USING (true);
  END IF;
END $$;

-- RLS 정책 - Service role INSERT 허용
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dart_companies' AND policyname = 'Service role can insert dart_companies') THEN
    CREATE POLICY "Service role can insert dart_companies" ON dart_companies FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- RLS 정책 - Service role UPDATE 허용
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dart_companies' AND policyname = 'Service role can update dart_companies') THEN
    CREATE POLICY "Service role can update dart_companies" ON dart_companies FOR UPDATE USING (true);
  END IF;
END $$;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_dart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dart_updated_at ON dart_companies;
CREATE TRIGGER trigger_dart_updated_at
BEFORE UPDATE ON dart_companies
FOR EACH ROW
EXECUTE FUNCTION update_dart_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE dart_companies IS 'DART 전자공시시스템 기업 정보 (상장/외감 기업)';
COMMENT ON COLUMN dart_companies.corp_code IS 'DART 고유번호 (8자리)';
COMMENT ON COLUMN dart_companies.business_number IS '사업자등록번호 (10자리, 하이픈 제거)';
COMMENT ON COLUMN dart_companies.corp_cls IS '법인구분: Y(유가증권), K(코스닥), N(코넥스), E(기타)';
