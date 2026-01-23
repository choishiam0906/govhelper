-- KSIC (한국표준산업분류) 코드 테이블
-- 10차 개정 기준 (2017년)
-- 업종코드를 업태/종목으로 변환하기 위한 참조 테이블

CREATE TABLE IF NOT EXISTS ksic_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,       -- 산업코드 (예: A, 01, 011, 0111, 01110)
  code_level INTEGER NOT NULL,             -- 코드 레벨 (1=대분류, 2=중분류, 3=소분류, 4=세분류, 5=세세분류)
  name VARCHAR(255) NOT NULL,              -- 산업명
  parent_code VARCHAR(10),                 -- 상위 코드 (대분류는 null)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ksic_code ON ksic_codes(code);
CREATE INDEX IF NOT EXISTS idx_ksic_code_level ON ksic_codes(code_level);
CREATE INDEX IF NOT EXISTS idx_ksic_parent_code ON ksic_codes(parent_code);

-- 코드 레벨 자동 계산 함수
CREATE OR REPLACE FUNCTION get_ksic_code_level(code TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF code ~ '^[A-U]$' THEN
    RETURN 1;  -- 대분류 (알파벳 1자리)
  ELSIF code ~ '^[0-9]{2}$' THEN
    RETURN 2;  -- 중분류 (숫자 2자리)
  ELSIF code ~ '^[0-9]{3}$' THEN
    RETURN 3;  -- 소분류 (숫자 3자리)
  ELSIF code ~ '^[0-9]{4}$' THEN
    RETURN 4;  -- 세분류 (숫자 4자리)
  ELSIF code ~ '^[0-9]{5}$' THEN
    RETURN 5;  -- 세세분류 (숫자 5자리)
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 상위 코드 자동 계산 함수
CREATE OR REPLACE FUNCTION get_ksic_parent_code(code TEXT)
RETURNS TEXT AS $$
DECLARE
  level INTEGER;
BEGIN
  level := get_ksic_code_level(code);

  CASE level
    WHEN 1 THEN RETURN NULL;  -- 대분류는 부모 없음
    WHEN 2 THEN
      -- 중분류 → 대분류 매핑 (01-03: A, 05-08: B, 10-34: C 등)
      -- 간소화를 위해 런타임에서 처리
      RETURN NULL;
    WHEN 3 THEN RETURN SUBSTRING(code FROM 1 FOR 2);
    WHEN 4 THEN RETURN SUBSTRING(code FROM 1 FOR 3);
    WHEN 5 THEN RETURN SUBSTRING(code FROM 1 FOR 4);
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 산업코드로 업태(대분류) 조회 함수
CREATE OR REPLACE FUNCTION get_business_type_from_industry_code(industry_code TEXT)
RETURNS TEXT AS $$
DECLARE
  major_code TEXT;
  result TEXT;
BEGIN
  IF industry_code IS NULL OR industry_code = '' THEN
    RETURN NULL;
  END IF;

  -- 숫자 5자리 코드인 경우 첫 2자리로 대분류 찾기
  IF industry_code ~ '^[0-9]{5}$' THEN
    -- 중분류 코드
    major_code := SUBSTRING(industry_code FROM 1 FOR 2);

    -- 중분류 → 대분류 매핑
    CASE
      WHEN major_code IN ('01', '02', '03') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'A';
      WHEN major_code IN ('05', '06', '07', '08') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'B';
      WHEN major_code BETWEEN '10' AND '34' THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'C';
      WHEN major_code IN ('35') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'D';
      WHEN major_code IN ('36', '37', '38', '39') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'E';
      WHEN major_code IN ('41', '42') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'F';
      WHEN major_code IN ('45', '46', '47') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'G';
      WHEN major_code IN ('49', '50', '51', '52') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'H';
      WHEN major_code IN ('55', '56') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'I';
      WHEN major_code IN ('58', '59', '60', '61', '62', '63') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'J';
      WHEN major_code IN ('64', '65', '66') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'K';
      WHEN major_code IN ('68') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'L';
      WHEN major_code IN ('70', '71', '72', '73', '74', '75') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'M';
      WHEN major_code IN ('74', '75', '76') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'N';
      WHEN major_code IN ('84') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'O';
      WHEN major_code IN ('85') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'P';
      WHEN major_code IN ('86', '87', '88') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'Q';
      WHEN major_code IN ('90', '91') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'R';
      WHEN major_code IN ('94', '95', '96') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'S';
      WHEN major_code IN ('97', '98') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'T';
      WHEN major_code IN ('99') THEN
        SELECT name INTO result FROM ksic_codes WHERE code = 'U';
      ELSE
        result := NULL;
    END CASE;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 산업코드로 종목(세세분류) 조회 함수
CREATE OR REPLACE FUNCTION get_industry_name_from_code(industry_code TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF industry_code IS NULL OR industry_code = '' THEN
    RETURN NULL;
  END IF;

  -- 5자리 코드로 정확히 조회
  SELECT name INTO result FROM ksic_codes WHERE code = industry_code;

  -- 없으면 4자리로 시도
  IF result IS NULL AND LENGTH(industry_code) >= 4 THEN
    SELECT name INTO result FROM ksic_codes WHERE code = SUBSTRING(industry_code FROM 1 FOR 4);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- RLS 비활성화 (공개 참조 테이블)
ALTER TABLE ksic_codes DISABLE ROW LEVEL SECURITY;

-- 대분류 코드 기본 데이터 삽입 (21개)
INSERT INTO ksic_codes (code, code_level, name, parent_code) VALUES
  ('A', 1, '농업, 임업 및 어업', NULL),
  ('B', 1, '광업', NULL),
  ('C', 1, '제조업', NULL),
  ('D', 1, '전기, 가스, 증기 및 공기 조절 공급업', NULL),
  ('E', 1, '수도, 하수 및 폐기물 처리, 원료 재생업', NULL),
  ('F', 1, '건설업', NULL),
  ('G', 1, '도매 및 소매업', NULL),
  ('H', 1, '운수 및 창고업', NULL),
  ('I', 1, '숙박 및 음식점업', NULL),
  ('J', 1, '정보통신업', NULL),
  ('K', 1, '금융 및 보험업', NULL),
  ('L', 1, '부동산업', NULL),
  ('M', 1, '전문, 과학 및 기술 서비스업', NULL),
  ('N', 1, '사업시설 관리, 사업 지원 및 임대 서비스업', NULL),
  ('O', 1, '공공 행정, 국방 및 사회보장 행정', NULL),
  ('P', 1, '교육 서비스업', NULL),
  ('Q', 1, '보건업 및 사회복지 서비스업', NULL),
  ('R', 1, '예술, 스포츠 및 여가관련 서비스업', NULL),
  ('S', 1, '협회 및 단체, 수리 및 기타 개인 서비스업', NULL),
  ('T', 1, '가구 내 고용활동 및 달리 분류되지 않은 자가 소비 생산활동', NULL),
  ('U', 1, '국제 및 외국기관', NULL)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE ksic_codes IS '한국표준산업분류(KSIC) 10차 개정 코드 테이블';
COMMENT ON COLUMN ksic_codes.code IS '산업코드 (대분류: A-U, 중분류: 01-99, 소분류: 001-999, 세분류: 0001-9999, 세세분류: 00001-99999)';
COMMENT ON COLUMN ksic_codes.code_level IS '코드 레벨 (1=대분류, 2=중분류, 3=소분류, 4=세분류, 5=세세분류)';
