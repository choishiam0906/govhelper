import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileContent } from './profile-content'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 기업 정보 조회
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <ProfileContent user={user} company={company} />
}
