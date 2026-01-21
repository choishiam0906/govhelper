-- 비회원 매칭 리드 테이블
CREATE TABLE IF NOT EXISTS guest_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  business_number VARCHAR(20),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  employee_count INTEGER,
  founded_date DATE,
  location VARCHAR(100),
  annual_revenue BIGINT,
  certifications TEXT[], -- 보유 인증 (벤처, 이노비즈 등)
  description TEXT,

  -- 메타 정보
  ip_address VARCHAR(45),
  user_agent TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- 전환 정보
  converted_to_user BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 비회원 매칭 결과 테이블
CREATE TABLE IF NOT EXISTS guest_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES guest_leads(id) ON DELETE CASCADE,

  -- 매칭 결과 (JSON 배열로 상위 N개 저장)
  matches JSONB NOT NULL DEFAULT '[]',
  -- 예시: [{ "rank": 1, "announcement_id": "...", "score": 85, "analysis": {...} }, ...]

  -- 결제/공개 상태
  top_revealed BOOLEAN DEFAULT false, -- 1순위 공개 여부
  payment_id UUID, -- 결제 시 참조
  revealed_at TIMESTAMPTZ,

  -- 이메일 발송
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_guest_leads_email ON guest_leads(email);
CREATE INDEX IF NOT EXISTS idx_guest_leads_business_number ON guest_leads(business_number);
CREATE INDEX IF NOT EXISTS idx_guest_leads_created_at ON guest_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_matches_lead_id ON guest_matches(lead_id);

-- RLS 정책 (비회원이므로 service role만 접근)
ALTER TABLE guest_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_matches ENABLE ROW LEVEL SECURITY;

-- Service role은 모든 작업 가능
CREATE POLICY "Service role can do all on guest_leads" ON guest_leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do all on guest_matches" ON guest_matches
  FOR ALL USING (true) WITH CHECK (true);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_guest_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guest_leads_updated_at
  BEFORE UPDATE ON guest_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_leads_updated_at();
