import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
console.log('Using Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: m, error } = await supabase.from('monitors').select('*').ilike('id', 'e502e13e%')
console.log('--- monitor by id prefix ---', error)
console.log(JSON.stringify(m, null, 2))

const { count } = await supabase.from('monitors').select('*', { count: 'exact', head: true })
console.log('total monitors in this DB:', count)
