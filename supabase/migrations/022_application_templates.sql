-- 지원서 템플릿 테이블
-- 2026-01-25

CREATE TABLE IF NOT EXISTS application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]',
  -- sections 구조: [{ "sectionName": "사업 개요", "content": "..." }, ...]
  is_default BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_templates_user ON application_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_default ON application_templates(user_id, is_default);

-- RLS 정책
ALTER TABLE application_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
ON application_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
ON application_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON application_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON application_templates FOR DELETE
USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_application_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_templates_updated_at
BEFORE UPDATE ON application_templates
FOR EACH ROW
EXECUTE FUNCTION update_application_templates_updated_at();

-- 사용자별 하나의 기본 템플릿만 허용하는 함수
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE application_templates
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_template
BEFORE INSERT OR UPDATE ON application_templates
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_template();
