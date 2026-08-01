import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: monitors } = await supabase.from('monitors').select('id,name,target,status,created_at').ilike('target', '%1245%')
console.log('--- monitor ---')
console.log(JSON.stringify(monitors, null, 2))

const monitorId = monitors?.[0]?.id
if (monitorId) {
  const { data: incidents } = await supabase.from('incidents').select('*').eq('monitor_id', monitorId).order('started_at', { ascending: true })
  console.log('--- incidents for this monitor ---')
  console.log(JSON.stringify(incidents, null, 2))
}

const { data: cronRuns } = await supabase.from('cron_run_log').select('*').order('started_at', { ascending: false }).limit(5)
console.log('--- recent cron_run_log ---')
console.log(JSON.stringify(cronRuns, null, 2))
