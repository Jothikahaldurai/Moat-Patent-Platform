import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [searches, patents, collections] = await Promise.all([
      supabase.from('recent_searches').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('saved_patents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    return NextResponse.json({
      totalSearches: searches.count || 0,
      savedPatents: patents.count || 0,
      collections: collections.count || 0
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
