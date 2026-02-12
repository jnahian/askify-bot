import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getChangelogByVersion, getChangelogSummary } from '@/lib/content/changelog'
import { ChangelogItem } from '@/components/changelog/ChangelogItem'
import { ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/changelog/$version')({
  loader: async ({ params }) => {
    const changelog = await getChangelogByVersion(params.version)
    if (!changelog) {
      throw notFound()
    }
    return { changelog }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Askify v${loaderData?.changelog.version} — Changelog`,
      },
      {
        name: 'description',
        content: loaderData ? getChangelogSummary(loaderData.changelog) : '',
      },
    ],
    links: loaderData
      ? [
          {
            rel: 'canonical',
            href: `https://askify.jnahian.me/changelog/${loaderData.changelog.version}`,
          },
        ]
      : [],
  }),
  component: ChangelogPage,
})

function ChangelogPage() {
  const { changelog } = Route.useLoaderData()

  return (
    <div>
      {/* Back Link */}
      <Link
        to="/changelog"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to all versions
      </Link>

      {/* Changelog Detail */}
      <ChangelogItem changelog={changelog} />

      {/* Footer */}
      <div className="mt-8 text-center">
        <a
          href={`https://github.com/jnahian/askify-bot/releases/tag/v${changelog.version}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--brand)] hover:underline"
        >
          View release on GitHub →
        </a>
      </div>
    </div>
  )
}
