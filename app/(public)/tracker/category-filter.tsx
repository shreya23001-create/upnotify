'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Sparkles, Plane, Car, Landmark, Briefcase, Server, Cloud, MessageCircle,
  Bitcoin, Truck, Palette, Code2, ShoppingCart, GraduationCap, Mail,
  DollarSign, UtensilsCrossed, Gamepad2, Building2, Heart, Network, Music,
  Newspaper, MoreHorizontal, CreditCard, Zap, Layers, Search, Shield, Share2,
  Tv, Bus, MapPin, Film,
} from 'lucide-react'

const VISIBLE_COUNT = 8

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'AI': Sparkles,
  'Airlines': Plane,
  'Automotive': Car,
  'Banking': Landmark,
  'Business': Briefcase,
  'CDN & Infrastructure': Server,
  'CMS': Layers,
  'Cloud & Hosting': Cloud,
  'Communication': MessageCircle,
  'Crypto': Bitcoin,
  'Delivery': Truck,
  'Design & Creative': Palette,
  'Dev Tools': Code2,
  'E-commerce': ShoppingCart,
  'Education': GraduationCap,
  'Email & Marketing': Mail,
  'Finance': DollarSign,
  'Food & Delivery': UtensilsCrossed,
  'Gaming': Gamepad2,
  'Government': Building2,
  'Healthcare': Heart,
  'Jobs': Briefcase,
  'Logistics': Network,
  'Music': Music,
  'News & Media': Newspaper,
  'Other': MoreHorizontal,
  'Payments': CreditCard,
  'Productivity': Zap,
  'Real Estate': Building2,
  'SaaS': Layers,
  'Search & Ads': Search,
  'Security': Shield,
  'Social': Share2,
  'Social Media': Share2,
  'Streaming': Tv,
  'Streaming & Video': Film,
  'Telecom': MessageCircle,
  'Transport': Bus,
  'Travel': MapPin,
  'Video & Streaming': Film,
}

function buildHref(category: string | undefined): string {
  if (!category || category === 'all') return '/tracker'
  return `/tracker?category=${encodeURIComponent(category)}`
}

function CategoryPill({ cat, active }: { cat: string; active: boolean }) {
  const Icon = CATEGORY_ICONS[cat]
  return (
    <Link
      href={buildHref(cat)}
      className={`tracker-category-pill${active ? ' tracker-category-pill-active' : ''}`}
    >
      {Icon && <Icon size={14} strokeWidth={2.25} />}
      {cat}
    </Link>
  )
}

export function CategoryFilter({
  categories,
  selectedCategory,
}: {
  categories: string[]
  selectedCategory: string | undefined
}) {
  const isAllActive = !selectedCategory || selectedCategory === 'all'
  const visible = categories.slice(0, VISIBLE_COUNT)
  const hidden = categories.slice(VISIBLE_COUNT)
  const selectedInVisible = !selectedCategory || visible.includes(selectedCategory)
  const [expanded, setExpanded] = useState(!selectedInVisible)

  useEffect(() => {
    if (!selectedInVisible) setExpanded(true)
  }, [selectedCategory, selectedInVisible])

  return (
    <div>
      <div className="tracker-category-filter">
        <Link
          href={buildHref(undefined)}
          className={`tracker-category-pill${isAllActive ? ' tracker-category-pill-active' : ''}`}
        >
          All
        </Link>
        {visible.map((cat) => (
          <CategoryPill key={cat} cat={cat} active={selectedCategory === cat} />
        ))}
        {hidden.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="tracker-category-pill tracker-category-more"
          >
            {expanded ? <>Show less <ChevronUp size={13} strokeWidth={2.5} /></> : <>+{hidden.length} more <ChevronDown size={13} strokeWidth={2.5} /></>}
          </button>
        )}
      </div>
      {expanded && hidden.length > 0 && (
        <div className="tracker-category-filter tracker-category-filter-scroll">
          {hidden.map((cat) => (
            <CategoryPill key={cat} cat={cat} active={selectedCategory === cat} />
          ))}
        </div>
      )}
    </div>
  )
}
