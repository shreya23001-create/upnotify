import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Workspace } from '@/lib/types'

export async function getWorkspacesByOrg(orgId: string): Promise<Workspace[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to get workspaces', { error: error.message })
    return []
  }
  return data ?? []
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get workspace', { error: error.message })
    return null
  }
  return data
}

export async function createWorkspace(
  input: { org_id: string; name: string; slug: string }
): Promise<Workspace | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .insert(input)
    .select()
    .single()

  if (error) {
    logger.error('Failed to create workspace', { error: error.message })
    return null
  }
  return data
}

export async function updateWorkspace(
  id: string,
  updates: { name?: string; slug?: string }
): Promise<Workspace | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update workspace', { error: error.message })
    return null
  }
  return data
}
