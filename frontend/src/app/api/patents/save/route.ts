import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { patent } = await request.json()
    const { data, error } = await supabase.from('saved_patents').upsert({
      user_id: user.id,
      patent_number: patent.patent_number,
      title: patent.title,
      assignee: patent.assignee,
      inventors: patent.inventors || [],
      filing_date: patent.filing_date,
      publication_date: patent.publication_date,
      status: patent.status || 'Unknown',
      abstract: patent.abstract,
      ipc_codes: patent.ipc_codes || [],
      cpc_codes: patent.cpc_codes || [],
      jurisdiction: patent.jurisdiction || 'US',
      citations: patent.citations || 0,
      ai_match_score: patent.ai_match_score,
      raw_data: patent
    }, { onConflict: 'user_id,patent_number' }).select().single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { patentId } = await request.json()
    const { error } = await supabase.from('saved_patents')
      .delete().eq('id', patentId).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
