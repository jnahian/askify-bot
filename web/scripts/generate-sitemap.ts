/**
 * Generate sitemap.xml from content
 * Run with: npx tsx scripts/generate-sitemap.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

// Simple sitemap generator - runs at build time
const baseUrl = 'https://askify.jnahian.me'

const staticPages = [
  { loc: '/', priority: 1.0, changefreq: 'weekly' },
  { loc: '/docs', priority: 0.9, changefreq: 'weekly' },
  { loc: '/changelog', priority: 0.8, changefreq: 'weekly' },
  { loc: '/terms', priority: 0.5, changefreq: 'monthly' },
  { loc: '/privacy', priority: 0.5, changefreq: 'monthly' },
]

const docPages = [
  'getting-started',
  'poll-types',
  'commands',
  'voting-results',
  'scheduling',
  'templates',
  'advanced-settings',
  'architecture',
].map((id) => ({
  loc: `/docs/${id}`,
  priority: 0.8,
  changefreq: 'weekly',
}))

const changelogPages = ['1.1.0', '1.0.1', '1.0.0'].map((version) => ({
  loc: `/changelog/${version}`,
  priority: 0.7,
  changefreq: 'never',
}))

const allPages = [...staticPages, ...docPages, ...changelogPages]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

const outputPath = join(process.cwd(), 'public', 'sitemap.xml')
writeFileSync(outputPath, sitemap, 'utf-8')

console.log(`✓ Sitemap generated at ${outputPath}`)
console.log(`✓ ${allPages.length} URLs included`)
