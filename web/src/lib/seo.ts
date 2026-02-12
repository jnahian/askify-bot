/**
 * SEO Utilities
 * Generate meta tags, Open Graph, Twitter Card, and structured data
 */

export interface SEOMetadata {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image'
  keywords?: string[]
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

/**
 * Generate complete meta tags for a page
 */
export function generateMeta(metadata: SEOMetadata) {
  const {
    title,
    description,
    canonical,
    ogImage = '/assets/og-images/default.png',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    keywords = [],
    author,
    publishedTime,
    modifiedTime,
  } = metadata

  const siteUrl = 'https://askify.app' // TODO: Move to env config

  const meta = [
    // Basic Meta
    { name: 'description', content: description },
    { name: 'keywords', content: keywords.join(', ') },
    ...(author ? [{ name: 'author', content: author }] : []),

    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: ogType },
    { property: 'og:image', content: `${siteUrl}${ogImage}` },
    { property: 'og:url', content: canonical ? `${siteUrl}${canonical}` : siteUrl },
    { property: 'og:site_name', content: 'Askify' },

    // Twitter Card
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${siteUrl}${ogImage}` },

    // Article specific
    ...(publishedTime ? [{ property: 'article:published_time', content: publishedTime }] : []),
    ...(modifiedTime ? [{ property: 'article:modified_time', content: modifiedTime }] : []),
  ]

  return {
    title: `${title} — Askify`,
    meta,
    link: canonical ? [{ rel: 'canonical', href: `${siteUrl}${canonical}` }] : [],
  }
}

/**
 * Generate structured data (JSON-LD) for a page
 */
export function generateStructuredData(type: 'website' | 'article' | 'breadcrumb', data: any) {
  const baseUrl = 'https://askify.app'

  switch (type) {
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Askify',
        description: 'Powerful Slack polls made simple',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/docs?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }

    case 'article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime,
        author: {
          '@type': 'Organization',
          name: 'Askify',
        },
      }

    case 'breadcrumb':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.path}`,
        })),
      }

    default:
      return null
  }
}

/**
 * Generate sitemap URLs (for sitemap.xml generation)
 */
export interface SitemapURL {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemapURL(
  path: string,
  options: Omit<SitemapURL, 'loc'> = {},
): SitemapURL {
  return {
    loc: `https://askify.app${path}`,
    changefreq: 'weekly',
    priority: 0.7,
    ...options,
  }
}

/**
 * Default SEO keywords for Askify
 */
export const DEFAULT_KEYWORDS = [
  'slack polls',
  'slack bot',
  'team voting',
  'slack survey',
  'poll bot',
  'team decisions',
  'slack app',
  'internal tool',
  'team engagement',
  'feedback collection',
]
