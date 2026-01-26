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
  const { data: companyData } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = companyData as any

  // 기업 문서 조회
  let documents: Array<{
    id: string
    file_name: string
    file_size: number
    status: 'pending' | 'processing' | 'completed' | 'failed'
    error_message?: string
    page_count?: number
    created_at: string
  }> = []

  // company가 있으면 문서 조회
  if (company?.id) {
    const { data: docs } = await (supabase
      .from('company_documents') as any)
      .select('id, file_name, file_size, status, error_message, page_count, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    documents = docs || []
  }

  return <ProfileContent user={user} company={company} documents={documents} />
}
