import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('plans')
    .select('name, slug, price_monthly_gbp, price_annual_gbp, price_monthly_inr, price_annual_inr, monitor_limit, check_interval_seconds, max_team_members, has_email_alerts, has_slack_teams, has_webhooks, has_status_pages, status_page_limit, has_status_page_custom_domain, has_ai_predictive, ai_report_limit, has_api_access, data_retention_days, competitor_limit, is_visible, llms_txt_limit, citation_check_monthly_limit, wp_monitor_limit')
    .eq('is_visible', true)
    .order('price_monthly_gbp', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Plans temporarily unavailable. Please try again shortly.' }, { status: 503 })
  }

  return NextResponse.json({ plans: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
