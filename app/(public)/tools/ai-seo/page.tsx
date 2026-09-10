import type { Metadata } from 'next'
import { ToolPillarLanding, type ToolPillarData } from '@/components/landing/tool-pillar-landing'
import '../../landing.css'

const data: ToolPillarData = {
  pillarSlug: 'ai-seo',
  seoTitle: 'Free AI & SEO Tools — AI SEO Checker, Redirect Chain, robots.txt | Upnotify',
  seoDescription:
    'Free AI and SEO tools: AI SEO Checker for ChatGPT/Perplexity/Claude/Gemini visibility, redirect chain tracer for SEO loops and excessive hops, and robots.txt analyser. No signup required.',
  heroTitle: 'Free AI & SEO Tools',
  heroSubtitle:
    'Check whether AI engines can crawl and cite your site, trace redirect chains that hurt rankings, and audit robots.txt for accidental Googlebot blocks. The three tools every SEO should run quarterly.',
  whyItMatters: [
    "Search has split into two ecosystems: traditional Google, and AI engines (ChatGPT, Perplexity, Claude, Gemini, Copilot). The infrastructure that lets each one find and cite your content overlaps but is not identical. A robots.txt rule that's fine for Googlebot can block GPTBot. A 6-hop redirect chain that Google tolerates can confuse AI crawlers entirely.",
    "These three tools cover the basics: see how AI-ready your site is across crawler access / metadata / structure, trace every redirect hop to spot loops or excessive chains, and audit your robots.txt to confirm you're not accidentally blocking the engines you want to be cited by.",
  ],
  tools: [
    {
      slug: 'ai-seo-checker',
      label: 'AI SEO Checker',
      oneLiner: 'Score AI readiness for ChatGPT, Perplexity, Claude, Gemini. Audit crawler access, generate llms.txt, find submission targets.',
      badge: 'New',
    },
    {
      slug: 'redirect-chain-checker',
      label: 'Redirect Chain Checker',
      oneLiner: 'Trace the full redirect chain. Detect loops, excessive hops, and SEO-damaging 302 redirects.',
    },
    {
      slug: 'robots-txt-checker',
      label: 'robots.txt Checker',
      oneLiner: 'Fetch and analyse robots.txt for any site. See all rules, detect Googlebot blocks, missing sitemaps.',
    },
  ],
  monitors: [
    {
      slug: 'redirect-chain-monitoring',
      label: 'Redirect chain monitoring',
      why: 'Continuous version of Redirect Chain Checker. Alerts when a redirect loop, excessive hops, or a broken final destination silently appears after a CMS or framework change.',
    },
    {
      slug: 'robots-txt-monitoring',
      label: 'robots.txt monitoring',
      why: 'A single accidental Disallow: / can deindex your entire site. Continuous monitoring catches the change within minutes — long before Googlebot has stopped crawling.',
    },
    {
      slug: 'sitemap-monitoring',
      label: 'Sitemap monitoring',
      why: 'A broken /sitemap.xml stops Google discovering new pages. Continuous monitoring confirms the sitemap stays accessible and valid XML.',
    },
    {
      slug: 'keyword-monitoring',
      label: 'Keyword monitoring',
      why: 'Verify critical SEO copy (meta description text, structured data markers, AI-readable content blocks) remains on the page after deploys.',
    },
  ],
  faq: [
    {
      q: 'Is the AI SEO Checker the same as Upnotify AI Visibility?',
      a: 'No. The AI SEO Checker is a one-off snapshot — does your site appear AI-ready right now (crawler access, metadata, structure, llms.txt). Upnotify AI Visibility (separate product at aivisibility.uptrue.io) is the continuous tracking layer — does ChatGPT actually cite you for the keywords you target, week after week. The Checker is the doorstep diagnostic; AI Visibility is the rolling vital signs.',
    },
    {
      q: 'How many redirect hops is too many?',
      a: 'Google recommends fewer than 3. Anything over 5 is a strong signal something is wrong (e.g. legacy URL → CDN redirect → HTTPS upgrade → CMS rewrite → final). Long chains slow page load for every visitor and can drop pages from Google\'s index entirely.',
    },
    {
      q: 'Can I block GPTBot but allow Googlebot?',
      a: 'Yes — robots.txt supports per-user-agent rules. Use `User-agent: GPTBot` followed by `Disallow: /` to block OpenAI, and a separate `User-agent: Googlebot` block to allow Google. The robots.txt Checker shows which user-agents are blocked vs allowed for any site.',
    },
    {
      q: 'My pages aren\'t in AI search results — is the AI SEO Checker enough?',
      a: 'It diagnoses the technical layer (can crawlers reach you, is structure machine-readable, is llms.txt set up). It does NOT measure whether AI engines cite you for specific queries — for that, use Upnotify AI Visibility. Many sites fix the technical layer and still aren\'t cited because their content quality / authority isn\'t there yet. Both are needed.',
    },
    {
      q: 'Are these tools really free?',
      a: 'Yes. All three run against our edge — no signup, no email capture. Use them on any public URL as many times as you want.',
    },
  ],
}

export const metadata: Metadata = {
  title: data.seoTitle,
  description: data.seoDescription,
  alternates: { canonical: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}` },
  openGraph: {
    title: data.seoTitle,
    description: data.seoDescription,
    url: `https://upnotify-monitoring.vercel.app/tools/${data.pillarSlug}`,
    type: 'website',
  },
}

export default function AiSeoToolsPillarPage(): React.ReactElement {
  return <ToolPillarLanding data={data} />
}
