import { createFileRoute } from '@tanstack/react-router'
import { getAllChangelogs } from '@/lib/content/changelog'
import { ChangelogItem } from '@/components/changelog/ChangelogItem'

export const Route = createFileRoute('/changelog/')({
  loader: async () => {
    const changelogs = await getAllChangelogs()
    return { changelogs }
  },
  head: () => ({
    meta: [
      {
        title: 'Changelog — Askify',
      },
      {
        name: 'description',
        content: 'See what\'s new in Askify. Track new features, improvements, and bug fixes across all versions.',
      },
    ],
  }),
  component: ChangelogIndex,
})

function ChangelogIndex() {
  const { changelogs } = Route.useLoaderData()

  return (
    <div>
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          Changelog
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Track new features, improvements, and bug fixes. Stay up to date with the latest Askify releases.
        </p>
      </header>

      {/* Changelog List */}
      <div className="space-y-8">
        {changelogs.map((changelog, index) => (
          <ChangelogItem
            key={changelog.version}
            changelog={changelog}
            isLatest={index === 0}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Looking for older versions?{' '}
          <a
            href="https://github.com/jnahian/askify-bot/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] hover:underline"
          >
            View all releases on GitHub
          </a>
        </p>
      </div>
    </div>
  )
}
