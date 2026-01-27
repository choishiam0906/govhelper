-- guest_leads 테이블에 retargeting_sent_at 컬럼 추가
-- 재타겟팅 이메일 발송 일시 기록

ALTER TABLE guest_leads
ADD COLUMN IF NOT EXISTS retargeting_sent_at TIMESTAMPTZ;

-- 인덱스 추가 (Cron job에서 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_guest_leads_retargeting_sent_at
ON guest_leads(retargeting_sent_at)
WHERE retargeting_sent_at IS NULL;

COMMENT ON COLUMN guest_leads.retargeting_sent_at IS '재타겟팅 이메일 발송 일시';
