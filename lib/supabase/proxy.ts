import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'

/**
 * Supabase client for the proxy (middleware) context.
 * Cannot use cookies() from next/headers here — must read/write
 * cookies directly on the request/response pair.
 *
 * Uses process.env directly because the proxy runs in edge context
 * where getConfig() may not be available. This is the only exception
 * besides lib/utils/config.ts.
 */
export function createProxyClient(request: NextRequest): {
  supabase: ReturnType<typeof createServerClient<Database>>
  response: () => NextResponse
} {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response: () => response }
}
