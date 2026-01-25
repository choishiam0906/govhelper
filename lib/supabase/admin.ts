import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client (Service Role Key 사용)
 * - Cron job, 백그라운드 작업 등 인증 없이 데이터 접근 필요 시 사용
 * - RLS를 우회하므로 주의해서 사용할 것
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
