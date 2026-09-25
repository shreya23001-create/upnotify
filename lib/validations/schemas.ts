import { z } from 'zod'

// ──────────────────────────────────────────────
// Shared reusable field schemas
// ──────────────────────────────────────────────

export const uuidSchema = z
  .string()
  .uuid('Must be a valid UUID')

export const emailSchema = z
  .string()
  .email('Must be a valid email address')
  .max(320, 'Email must not exceed 320 characters')

export const urlSchema = z
  .string()
  .url('Must be a valid URL')
  .max(2048, 'URL must not exceed 2048 characters')

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(128, 'Slug must not exceed 128 characters')
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen')

export const shortTextSchema = z
  .string()
  .min(1)
  .max(255, 'Must not exceed 255 characters')

// ──────────────────────────────────────────────
// Status page subscribe
// ──────────────────────────────────────────────

export const statusPageSubscribeSchema = z.object({
  statusPageId: uuidSchema,
  email: emailSchema.optional(),
  webhookUrl: urlSchema.optional(),
  type: z.enum(['slack', 'teams']).optional(),
}).refine(
  (data) => data.email || data.webhookUrl,
  { message: 'Either email or webhookUrl is required' },
).refine(
  (data) => {
    if (data.type === 'slack' && data.webhookUrl) {
      return data.webhookUrl.startsWith('https://hooks.slack.com/') || data.webhookUrl.startsWith('https://hooks.workos.com/')
    }
    return true
  },
  { message: 'Must be a valid Slack webhook URL (https://hooks.slack.com/...)' },
).refine(
  (data) => {
    if (data.type === 'teams' && data.webhookUrl) {
      return data.webhookUrl.includes('webhook.office.com') || data.webhookUrl.includes('logic.azure.com') || data.webhookUrl.includes('office365.com')
    }
    return true
  },
  { message: 'Must be a valid Microsoft Teams webhook URL' },
)

export type StatusPageSubscribeInput = z.infer<typeof statusPageSubscribeSchema>

// ──────────────────────────────────────────────
// Billing checkout
// ──────────────────────────────────────────────

export const billingCheckoutSchema = z.object({
  planSlug: z
    .string()
    .min(1, 'Plan slug is required')
    .max(64, 'Plan slug must not exceed 64 characters'),
  billingCycle: z
    .enum(['monthly', 'annual'], {
      errorMap: (): { message: string } => ({ message: 'Billing cycle must be "monthly" or "annual"' }),
    })
    .optional()
    .default('monthly'),
})

export type BillingCheckoutInput = z.infer<typeof billingCheckoutSchema>

// ──────────────────────────────────────────────
// Organisation update
// ──────────────────────────────────────────────

export const organisationUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Organisation name is required')
      .max(255, 'Organisation name must not exceed 255 characters')
      .optional(),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(128, 'Slug must not exceed 128 characters')
      .optional(),
    timezone: z
      .string()
      .min(1, 'Timezone is required')
      .max(64, 'Timezone must not exceed 64 characters')
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.slug !== undefined || data.timezone !== undefined,
    { message: 'At least one field (name, slug, or timezone) must be provided' }
  )

export type OrganisationUpdateInput = z.infer<typeof organisationUpdateSchema>

// ──────────────────────────────────────────────
// Company details update
// ──────────────────────────────────────────────

export const companyDetailsSchema = z
  .object({
    company_name: shortTextSchema.optional(),
    company_address_line1: shortTextSchema.optional(),
    company_address_line2: z.string().max(255, 'Must not exceed 255 characters').optional(),
    company_city: shortTextSchema.optional(),
    company_postcode: z.string().max(20, 'Postcode must not exceed 20 characters').optional(),
    company_country: z.string().max(100, 'Country must not exceed 100 characters').optional(),
    company_registration_number: z.string().max(64, 'Registration number must not exceed 64 characters').optional(),
    company_vat_number: z.string().max(64, 'VAT number must not exceed 64 characters').optional(),
    billing_email: emailSchema.optional(),
    logo_url: z
      .string()
      .max(500000, 'Logo data must not exceed 500KB')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided' }
  )

export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>

// ──────────────────────────────────────────────
// Heartbeat webhook (query params, not body)
// ──────────────────────────────────────────────

export const heartbeatParamsSchema = z.object({
  id: uuidSchema,
})

export type HeartbeatParamsInput = z.infer<typeof heartbeatParamsSchema>

// ──────────────────────────────────────────────
// GDPR account deletion confirmation
// ──────────────────────────────────────────────

export const accountDeletionSchema = z.object({
  confirm: z
    .string()
    .refine(
      (val): boolean => val === 'DELETE MY ACCOUNT',
      { message: 'Confirmation must be exactly "DELETE MY ACCOUNT"' },
    ),
})

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>
