import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('compete_plans')
    .select('name, slug, product_limit, price_monthly_pence, price_yearly_pence, has_yearly_discount, extra_product_price_pence, max_extra_products, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }

  return NextResponse.json({ plans: data ?? [] }, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
