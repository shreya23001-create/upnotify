import { NextRequest } from 'next/server'
import { getActivePublicMonitorsPaginated } from '@/lib/db/public-monitors'

const PAGE_SIZE = 20

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const category = searchParams.get('category') || undefined

  const result = await getActivePublicMonitorsPaginated({ page, pageSize: PAGE_SIZE, category })

  return Response.json(result)
}
