-- Migration 10: Add company details to organisations for invoicing
-- =================================================================

alter table public.organisations
  add column if not exists company_name text,
  add column if not exists company_address_line1 text,
  add column if not exists company_address_line2 text,
  add column if not exists company_city text,
  add column if not exists company_postcode text,
  add column if not exists company_country text default 'GB',
  add column if not exists company_registration_number text,
  add column if not exists company_vat_number text,
  add column if not exists billing_email text,
  add column if not exists logo_url text;
