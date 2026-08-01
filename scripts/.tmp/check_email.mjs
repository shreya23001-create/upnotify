import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: providers } = await supabase.from('email_providers').select('*')
console.log('--- email_providers ---')
console.log(JSON.stringify(providers, null, 2))

const { data: routing } = await supabase.from('email_routing').select('*')
console.log('--- email_routing ---')
console.log(JSON.stringify(routing, null, 2))
