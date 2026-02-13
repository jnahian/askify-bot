import { Link } from '@tanstack/react-router'
import type { DocsByCategory } from '@/lib/content/schemas'

interface SidebarProps {
  docsByCategory: Array<DocsByCategory>
  currentDocId?: string
}

export function Sidebar({ docsByCategory, currentDocId }: SidebarProps) {
  return (
    <aside
      className="w-full md:w-64 flex-shrink-0"
      aria-label="Documentation navigation"
    >
      <nav
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8"
        role="navigation"
      >
        <div className="space-y-6">
          {docsByCategory.map((group) => (
            <div key={group.category}>
              {/* Category Heading */}
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 px-3">
                {group.category}
              </h3>

              {/* Docs in Category */}
              <ul className="space-y-1">
                {group.docs.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      to="/docs/$id"
                      params={{ id: doc.id }}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentDocId === doc.id
                          ? 'bg-[var(--brand)] text-white font-medium'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                      }`}
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
