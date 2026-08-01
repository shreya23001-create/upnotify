import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: monitors, error: e1 } = await supabase.from('monitors').select('id,name,target,status,created_at,check_interval_seconds').order('created_at', { ascending: false }).limit(10)
console.log('--- recent monitors ---', e1)
console.log(JSON.stringify(monitors, null, 2))

const { data: cronRuns, error: e2 } = await supabase.from('cron_run_log').select('*').limit(5)
console.log('--- cron_run_log sample ---', e2)
console.log(JSON.stringify(cronRuns, null, 2))
