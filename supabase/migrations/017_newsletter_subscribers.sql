-- 뉴스레터 구독자 테이블
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),

  -- 구독 상태
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),

  -- 구독 설정
  preferences JSONB DEFAULT '{"weekly_digest": true, "new_announcements": true, "tips": true}'::jsonb,

  -- 추적 정보
  source VARCHAR(50), -- landing, footer, popup, try_page
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- 인증
  confirmed BOOLEAN DEFAULT false,
  confirm_token VARCHAR(64),
  confirm_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,

  -- 수신거부
  unsubscribe_token VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- 통계
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_confirmed ON newsletter_subscribers(confirmed) WHERE confirmed = true;

-- 뉴스레터 발송 로그
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 캠페인 정보
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  content TEXT NOT NULL,

  -- 발송 상태
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- 통계
  total_recipients INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,

  -- 메타데이터
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 발송 상세 로그
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,

  -- 발송 상태
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- 에러 정보
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(campaign_id, subscriber_id)
);

-- 인덱스
CREATE INDEX idx_newsletter_sends_campaign ON newsletter_sends(campaign_id);
CREATE INDEX idx_newsletter_sends_subscriber ON newsletter_sends(subscriber_id);

-- RLS 정책
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY "Admins can manage newsletter subscribers"
ON newsletter_subscribers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage newsletter campaigns"
ON newsletter_campaigns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage newsletter sends"
ON newsletter_sends FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- 서비스 역할 접근 허용 (API용)
CREATE POLICY "Service role can manage subscribers"
ON newsletter_subscribers FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage campaigns"
ON newsletter_campaigns FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage sends"
ON newsletter_sends FOR ALL
USING (auth.role() = 'service_role');
