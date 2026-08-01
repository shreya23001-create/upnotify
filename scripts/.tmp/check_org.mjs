import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: m } = await supabase.from('monitors').select('id,org_id,name,target,status,created_at').ilike('target', '%1245%')
console.log('--- monitor(s) matching 1245 ---')
console.log(JSON.stringify(m, null, 2))

if (m && m.length) {
  const monitorId = m[0].id
  const { data: inc } = await supabase.from('incidents').select('*').eq('monitor_id', monitorId).order('started_at', { ascending: true })
  console.log('--- incidents ---')
  console.log(JSON.stringify(inc, null, 2))
}
