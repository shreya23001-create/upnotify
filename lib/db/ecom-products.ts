import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { EcomProduct, EcomProductGroup, EcomPriceHistory } from '@/lib/types'

// ============================================================
// Types for ecom function params
// ============================================================

export interface CreateProductData {
  org_id: string
  name: string
  url: string
  domain: string
  is_own_product?: boolean
  extraction_method?: string
  css_selector?: string | null
  product_group_id?: string | null
  check_interval_minutes?: number
}

export interface UpdateProductData {
  name?: string
  url?: string
  domain?: string
  is_own_product?: boolean
  extraction_method?: string
  css_selector?: string | null
  product_group_id?: string | null
  check_interval_minutes?: number
  last_price?: number | null
  last_currency?: string
  last_stock_status?: string | null
  last_checked_at?: string | null
  is_active?: boolean
}

export interface WritePriceData {
  price: number
  currency: string
  stock_status?: string | null
  extraction_method?: string | null
  confidence?: number | null
  raw_extracted_value?: string | null
}

// ============================================================
// Product CRUD (scoped by org_id — double protection with RLS)
// ============================================================

export async function getProductsByOrg(orgId: string): Promise<EcomProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get ecom products', { error: error.message, orgId })
    return []
  }
  return (data ?? []) as unknown as EcomProduct[]
}

export async function getProductById(
  id: string,
  orgId: string
): Promise<EcomProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    logger.error('Failed to get ecom product', { error: error.message, id })
    return null
  }
  return data as unknown as EcomProduct
}

export async function createProduct(
  productData: CreateProductData
): Promise<EcomProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .insert({
      org_id: productData.org_id,
      name: productData.name,
      url: productData.url,
      domain: productData.domain,
      is_own_product: productData.is_own_product ?? false,
      extraction_method: productData.extraction_method ?? 'auto',
      css_selector: productData.css_selector ?? null,
      product_group_id: productData.product_group_id ?? null,
      check_interval_minutes: productData.check_interval_minutes ?? 60,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create ecom product', { error: error.message, url: productData.url })
    return null
  }
  return data as unknown as EcomProduct
}

export async function updateProduct(
  id: string,
  orgId: string,
  updates: UpdateProductData
): Promise<EcomProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update ecom product', { error: error.message, id })
    return null
  }
  return data as unknown as EcomProduct
}

export async function deleteProduct(id: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ecom_products')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to delete ecom product', { error: error.message, id })
    return false
  }
  return true
}

export async function getProductsByGroup(
  groupId: string,
  orgId: string
): Promise<EcomProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .select('*')
    .eq('product_group_id', groupId)
    .eq('org_id', orgId)
    .order('is_own_product', { ascending: false })

  if (error) {
    logger.error('Failed to get products by group', { error: error.message, groupId })
    return []
  }
  return (data ?? []) as unknown as EcomProduct[]
}

export async function getProductCountByOrg(orgId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('ecom_products')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to count ecom products', { error: error.message, orgId })
    return 0
  }
  return count ?? 0
}

// ============================================================
// Product Groups
// ============================================================

export async function getProductGroups(orgId: string): Promise<EcomProductGroup[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_product_groups')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to get product groups', { error: error.message, orgId })
    return []
  }
  return (data ?? []) as unknown as EcomProductGroup[]
}

export async function createProductGroup(
  orgId: string,
  name: string
): Promise<EcomProductGroup | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ecom_product_groups')
    .insert({ org_id: orgId, name })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create product group', { error: error.message, name })
    return null
  }
  return data as unknown as EcomProductGroup
}

export async function deleteProductGroup(id: string, orgId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ecom_product_groups')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    logger.error('Failed to delete product group', { error: error.message, id })
    return false
  }
  return true
}

// ============================================================
// Price History (admin client for writes — cron/webhook context)
// ============================================================

export async function writePrice(
  productId: string,
  orgId: string,
  priceData: WritePriceData
): Promise<EcomPriceHistory | null> {
  const supabase = createAdminClient()

  // Write to price history (append-only)
  const { data, error } = await supabase
    .from('ecom_price_history')
    .insert({
      product_id: productId,
      org_id: orgId,
      price: priceData.price,
      currency: priceData.currency,
      stock_status: priceData.stock_status ?? null,
      extraction_method: priceData.extraction_method ?? null,
      confidence: priceData.confidence ?? null,
      raw_extracted_value: priceData.raw_extracted_value ?? null,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to write price history', { error: error.message, productId })
    return null
  }

  // Update the product's last known price
  const { error: updateError } = await supabase
    .from('ecom_products')
    .update({
      last_price: priceData.price,
      last_currency: priceData.currency,
      last_stock_status: priceData.stock_status ?? null,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('org_id', orgId)

  if (updateError) {
    logger.error('Failed to update product last price', { error: updateError.message, productId })
  }

  return data as unknown as EcomPriceHistory
}

export async function getPriceHistory(
  productId: string,
  days: number = 30
): Promise<EcomPriceHistory[]> {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('ecom_price_history')
    .select('*')
    .eq('product_id', productId)
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: true })

  if (error) {
    logger.error('Failed to get price history', { error: error.message, productId })
    return []
  }
  return (data ?? []) as unknown as EcomPriceHistory[]
}

/** Fetch a product by URL and org_id — used by webhook to match incoming data */
export async function getProductByUrl(
  url: string,
  orgId: string
): Promise<EcomProduct | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ecom_products')
    .select('*')
    .eq('url', url)
    .eq('org_id', orgId)
    .single()

  if (error) {
    return null
  }
  return data as unknown as EcomProduct
}
