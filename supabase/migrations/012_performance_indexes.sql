-- GovHelper 성능 최적화 인덱스
-- 생성일: 2026-01-24
-- 목적: 사업자번호 조회, 회사명 검색, 공고 필터링 성능 개선

-- ========================================
-- 1. pg_trgm 확장 활성화 (유사 검색용)
-- ========================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================
-- 2. NPS 테이블 (nps_business_registry) 인덱스
-- ========================================

-- 사업자번호 정확 매칭용 (이미 unique 제약조건 존재하지만 명시적 인덱스 추가)
-- 기존: idx_nps_business_number 존재 (006_nps_business_registry.sql)
-- 중복 생성 방지를 위해 CONCURRENTLY 옵션만 추가하여 재생성
DROP INDEX IF EXISTS idx_nps_business_number;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nps_business_number
ON nps_business_registry (business_number);

-- 회사명 유사 검색용 GIN 인덱스 (이미 존재하지만 CONCURRENTLY로 재생성)
-- 기존: idx_nps_company_name 존재
DROP INDEX IF EXISTS idx_nps_company_name;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nps_company_name_trgm
ON nps_business_registry USING gin (company_name gin_trgm_ops);

COMMENT ON INDEX idx_nps_business_number IS '사업자번호 정확 매칭용 B-tree 인덱스';
COMMENT ON INDEX idx_nps_company_name_trgm IS '회사명 유사 검색용 GIN 트리그램 인덱스 (LIKE %keyword% 성능 향상)';

-- ========================================
-- 3. DART 테이블 (dart_companies) 인덱스
-- ========================================

-- 회사명 유사 검색용 GIN 인덱스 (기존 idx_dart_corp_name_trgm 존재)
-- CONCURRENTLY 옵션 추가를 위해 재생성
DROP INDEX IF EXISTS idx_dart_corp_name_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dart_corp_name_trgm
ON dart_companies USING gin (corp_name gin_trgm_ops);

-- 업종코드 검색용 B-tree 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dart_industry_code
ON dart_companies (industry_code)
WHERE industry_code IS NOT NULL;

COMMENT ON INDEX idx_dart_corp_name_trgm IS '회사명 유사 검색용 GIN 트리그램 인덱스';
COMMENT ON INDEX idx_dart_industry_code IS '업종코드 필터링용 B-tree 인덱스 (NULL 제외)';

-- ========================================
-- 4. 공고 테이블 (announcements) 인덱스
-- ========================================

-- 활성 공고 마감일순 정렬용 복합 인덱스
-- 매칭/검색 페이지에서 가장 빈번하게 사용되는 쿼리 패턴:
-- WHERE status = 'active' ORDER BY application_end DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_status_end
ON announcements (status, application_end DESC)
WHERE status = 'active';

-- 소스별 필터링용 인덱스 (기존 idx_announcements_source 존재하지만 CONCURRENTLY로 재생성)
DROP INDEX IF EXISTS idx_announcements_source;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_source
ON announcements (source);

COMMENT ON INDEX idx_announcements_status_end IS '활성 공고 마감일순 정렬용 복합 인덱스 (WHERE status = ''active'' ORDER BY application_end)';
COMMENT ON INDEX idx_announcements_source IS '소스별 공고 필터링용 B-tree 인덱스 (중소벤처24, 기업마당 등)';

-- ========================================
-- 5. 인덱스 생성 완료 확인
-- ========================================

-- 생성된 인덱스 목록 조회 (확인용)
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '성능 최적화 인덱스 생성 완료';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'NPS 테이블: idx_nps_business_number, idx_nps_company_name_trgm';
  RAISE NOTICE 'DART 테이블: idx_dart_corp_name_trgm, idx_dart_industry_code';
  RAISE NOTICE '공고 테이블: idx_announcements_status_end, idx_announcements_source';
  RAISE NOTICE '============================================';
END $$;
