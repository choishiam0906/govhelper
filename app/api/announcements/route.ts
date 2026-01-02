import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const source = searchParams.get('source') || ''
    const status = searchParams.get('status') || 'active'

    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
