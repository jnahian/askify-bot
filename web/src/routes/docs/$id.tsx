import { Link, createFileRoute, notFound  } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getAdjacentDocs,
  getDocById,
  getDocsByCategory,
} from '@/lib/content/docs'
import { DocRenderer } from '@/components/docs/DocRenderer'
import { Sidebar } from '@/components/docs/Sidebar'

export const Route = createFileRoute('/docs/$id')({
  loader: async ({ params }) => {
    const doc = await getDocById(params.id)
    if (!doc) {
      throw notFound()
    }

    const adjacent = await getAdjacentDocs(params.id)
    const docsByCategory = await getDocsByCategory()

    return { doc, adjacent, docsByCategory }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.doc.title} — Askify Docs`,
      },
      {
        name: 'description',
        content: loaderData?.doc.description,
      },
    ],
    links: loaderData
      ? [
          {
            rel: 'canonical',
            href: `https://askify.jnahian.me/docs/${loaderData.doc.id}`,
          },
        ]
      : [],
  }),
  component: DocPage,
})

function DocPage() {
  const { doc, adjacent, docsByCategory } = Route.useLoaderData()

  return (
    <div>
      {/* Mobile Sidebar Toggle (could add later) */}
      <div className="md:hidden mb-6">
        <Sidebar docsByCategory={docsByCategory} currentDocId={doc.id} />
      </div>

      {/* Document Header */}
      <header className="mb-8 pb-6 border-b border-[var(--border)]">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
          {doc.title}
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          {doc.description}
        </p>
      </header>

      {/* Document Content */}
      <DocRenderer sections={doc.sections} />

      {/* Navigation Footer */}
      <nav className="mt-12 pt-8 border-t border-[var(--border)] flex justify-between items-center gap-4">
        {adjacent.prev ? (
          <Link
            to="/docs/$id"
            params={{ id: adjacent.prev.id }}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <div className="text-left">
              <div className="text-xs uppercase tracking-wide mb-1">
                Previous
              </div>
              <div className="font-medium">{adjacent.prev.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {adjacent.next ? (
          <Link
            to="/docs/$id"
            params={{ id: adjacent.next.id }}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors group"
          >
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide mb-1">Next</div>
              <div className="font-medium">{adjacent.next.title}</div>
            </div>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  )
}
