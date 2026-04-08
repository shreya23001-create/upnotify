import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('plans')
    .select('name, slug, price_monthly_gbp, price_annual_gbp, monitor_limit, check_interval_seconds, max_team_members, has_email_alerts, has_slack_teams, has_webhooks, has_status_pages, status_page_limit, has_status_page_custom_domain, has_ai_predictive, ai_report_limit, has_api_access, data_retention_days, competitor_limit, is_visible, llms_txt_limit, citation_check_monthly_limit')
    .eq('is_visible', true)
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }

  return NextResponse.json({ plans: data ?? [] }, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
