import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationEditor } from './application-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 지원서 조회
  const { data: applicationData, error } = await supabase
    .from('applications')
    .select(`
      id,
      content,
      status,
      created_at,
      updated_at,
      matches (
        id,
        match_score,
        analysis,
        announcements (
          id,
          title,
          organization,
          category,
          support_type,
          support_amount,
          application_end
        )
      )
    `)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (error || !applicationData) {
    notFound()
  }

  const application = applicationData as any

  return <ApplicationEditor application={application} />
}
