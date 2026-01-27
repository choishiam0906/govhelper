-- 중복 공고 감지 헬퍼 함수
-- 공고 첨부파일 업데이트 및 상태 변경 RPC 함수

-- 1. 공고 첨부파일 업데이트 함수
CREATE OR REPLACE FUNCTION update_announcement_attachments(
  p_announcement_id UUID,
  p_attachment_urls TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE announcements
  SET attachment_urls = p_attachment_urls
  WHERE id = p_announcement_id;
END;
$$;

-- 2. 공고 상태 일괄 변경 함수
CREATE OR REPLACE FUNCTION close_announcements(
  p_announcement_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE announcements
  SET status = 'closed'
  WHERE id = ANY(p_announcement_ids);
END;
$$;

-- 권한 설정 (authenticated 사용자만 호출 가능)
GRANT EXECUTE ON FUNCTION update_announcement_attachments(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION close_announcements(UUID[]) TO authenticated;
