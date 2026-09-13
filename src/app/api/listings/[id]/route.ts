import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  console.log('[listing/id] Fetching id:', id)
  console.log('[listing/id] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[listing/id] Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error, status } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    console.log('[listing/id] DB status:', status)
    console.log('[listing/id] DB error:', JSON.stringify(error))
    console.log('[listing/id] Data found:', !!data)

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code, id },
        { status: 404 }
      )
    }

    return NextResponse.json({ listing: data })

  } catch (err) {
    console.error('[listing/id] Exception:', err)
    return NextResponse.json(
      { error: String(err), id },
      { status: 500 }
    )
  }
}
