-- 미등록 사업자 승인 프로세스를 위한 스키마 변경

-- companies 테이블에 새 컬럼 추가
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_registered_business boolean DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_plan_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
-- approval_status: 'pending' (승인 대기), 'approved' (승인됨), 'rejected' (거절됨)

-- 기존 데이터는 모두 승인된 사업자로 간주
UPDATE companies SET is_registered_business = true, approval_status = 'approved' WHERE is_registered_business IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_companies_approval_status ON companies(approval_status);

-- Storage bucket for business plans (Supabase Dashboard에서 생성 필요)
-- 버킷명: business-plans
-- Public: false
-- Allowed MIME types: application/pdf

-- RLS 정책 (business-plans 버킷용)
-- 사용자는 자신의 파일만 업로드/조회 가능
