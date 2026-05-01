// ─── CMS Types ────────────────────────────────────────────────────────────────
// Typed schemas for every landing page section stored in page_sections table.
// The `content` JSONB column must match one of these interfaces based on section_type.

export type SectionType =
  | 'hero'
  | 'trusted_logos'
  | 'stats_bar'
  | 'features'
  | 'how_it_works'
  | 'ai_features'
  | 'agency'
  | 'faq'
  | 'testimonials'
  | 'comparison_table'
  | 'cta_band'
  | 'nav'
  | 'footer'
  | 'ticker'
  | 'custom'

// ── Hero ─────────────────────────────────────────────────────────────────────
export interface HeroContent {
  eyebrow:        string
  headline_line1: string
  headline_line2: string
  subheadline:    string
  cta_primary:    { text: string; href: string }
  cta_secondary?: { text: string; href: string }
  cta_tertiary?:  { text: string; href: string }
  trust_items?:   string[]
}

// ── Trusted Logos ─────────────────────────────────────────────────────────────
export interface TrustedLogosContent {
  label?: string
  logos:  Array<{
    name:   string
    url?:   string
    image?: string   // external image URL
    width?: number
  }>
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
export interface StatsBarContent {
  stats: Array<{ value: string; label: string; icon?: string }>
}

// ── Features ──────────────────────────────────────────────────────────────────
export interface FeaturesContent {
  eyebrow?:     string
  headline?:    string
  subheadline?: string
}

// ── How It Works ─────────────────────────────────────────────────────────────
export interface HowItWorksContent {
  eyebrow?:  string
  headline?: string
  steps:     Array<{
    number:      string
    title:       string
    description: string
    icon?:       string
  }>
}

// ── AI Features ──────────────────────────────────────────────────────────────
export interface AiFeaturesContent {
  eyebrow?:     string
  headline?:    string
  subheadline?: string
  features:     Array<{
    icon:        string
    color:       string   // 'purple' | 'cyan' | 'pink' | 'blue'
    title:       string
    description: string
  }>
}

// ── Agency ────────────────────────────────────────────────────────────────────
export interface AgencyContent {
  badge?:       string
  headline:     string
  description:  string
  badges?:      string[]
  cta_note?:    string
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
export interface FaqContent {
  eyebrow?: string
  headline?: string
  items:    Array<{ question: string; answer: string }>
}

// ── Testimonials ──────────────────────────────────────────────────────────────
export interface TestimonialsContent {
  eyebrow?:  string
  headline?: string
  items:     Array<{
    quote:     string
    name:      string
    role:      string
    company?:  string
    initials:  string
    avatar?:   string   // image URL — falls back to initials
  }>
}

// ── Comparison Table ──────────────────────────────────────────────────────────
export interface ComparisonTableContent {
  eyebrow?:     string
  headline?:    string
  subheadline?: string
  competitors:  string[]    // column headers e.g. ['Uptrue', 'BetterUptime', 'UptimeRobot']
  rows:         Array<{
    feature:    string
    values:     Array<boolean | string>
    type:       'boolean' | 'text'
    highlight?: number      // index of the "best" column (0-based)
  }>
  footnote?:    string
}

// ── CTA Band ──────────────────────────────────────────────────────────────────
export interface CtaBandContent {
  eyebrow?:        string
  headline:        string
  subheadline?:    string
  cta_primary:     { text: string; href: string }
  cta_secondary?:  { text: string; href: string }
  trust_items?:    string[]
}

// ── Custom (free-form) ────────────────────────────────────────────────────────
export interface CustomContent {
  html?:     string
  markdown?: string
  title?:    string
  label?:    string
}

// ── Nav ───────────────────────────────────────────────────────────────────────
export interface NavContent {
  links: Array<{ label: string; href: string; badge?: string }>
  cta_primary?:   { text: string; href: string }
  cta_secondary?: { text: string; href: string }
}

// ── Footer ────────────────────────────────────────────────────────────────────
export interface FooterContent {
  description?:  string
  trust_items?:  string[]
  columns: Array<{
    title: string
    links: Array<{ label: string; href: string; badge?: string; external?: boolean }>
  }>
  bottom_text?:  string
}

// ── Ticker ────────────────────────────────────────────────────────────────────
export interface TickerContent {
  label?: string   // reserved for future — ticker is data-driven
}

// ── Union ─────────────────────────────────────────────────────────────────────
export type SectionContent =
  | HeroContent
  | TrustedLogosContent
  | StatsBarContent
  | FeaturesContent
  | HowItWorksContent
  | AiFeaturesContent
  | AgencyContent
  | FaqContent
  | TestimonialsContent
  | ComparisonTableContent
  | CtaBandContent
  | NavContent
  | FooterContent
  | TickerContent
  | CustomContent

// ── Page Section row (mirrors DB) ─────────────────────────────────────────────
export interface PageSection {
  id:           string
  page:         string
  section_key:  string
  section_type: SectionType
  content:      SectionContent
  theme?:       SectionTheme | null
  sort_order:   number
  is_visible:   boolean
  updated_at?:  string | null
  updated_by?:  string | null
}

// ── Per-section theme override ────────────────────────────────────────────────
export interface SectionTheme {
  background?:  string    // CSS colour or 'gradient'
  text_color?:  string
  accent?:      string
}

// ── Global CMS theme ──────────────────────────────────────────────────────────
export interface CmsThemeSettings {
  colors: {
    brand_primary:   string
    brand_secondary: string
    accent:          string
    success?:        string
    warning?:        string
    danger?:         string
  }
  gradient:          string
  dark_mode_default?: boolean
}

export interface CmsTheme {
  id:         string
  key:        string
  settings:   CmsThemeSettings
  updated_at: string
  updated_by?: string | null
}

// ── Helper: narrow content by section type ───────────────────────────────────
export function getSectionContent<T extends SectionType>(
  section: PageSection,
  _type: T
): Extract<PageSection, { section_type: T }>['content'] {
  return section.content as never
}
