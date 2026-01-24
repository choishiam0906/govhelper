-- 기존 가입자를 뉴스레터 구독자로 등록
-- 이미 등록된 이메일은 건너뜀 (UNIQUE 제약조건)

INSERT INTO newsletter_subscribers (
  email,
  name,
  status,
  confirmed,
  confirmed_at,
  source,
  created_at
)
SELECT
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
  'active' as status,
  true as confirmed,
  COALESCE(u.email_confirmed_at, u.created_at) as confirmed_at,
  'user_sync' as source,
  u.created_at
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM newsletter_subscribers ns
    WHERE ns.email = u.email
  )
ON CONFLICT (email) DO NOTHING;

-- 동기화된 사용자 수 확인용 (결과 로그)
-- SELECT COUNT(*) as synced_users FROM newsletter_subscribers WHERE source = 'user_sync';
