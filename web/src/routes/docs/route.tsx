import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'
import { Sidebar } from '@/components/docs/Sidebar'
import { getDocsByCategory } from '@/lib/content/docs'

export const Route = createFileRoute('/docs')({
  loader: async () => {
    const docsByCategory = await getDocsByCategory()
    return { docsByCategory }
  },
  component: DocsLayout,
})

function DocsLayout() {
  const { docsByCategory } = Route.useLoaderData()

  return (
    <div className="py-12">
      <Container size="xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <Sidebar docsByCategory={docsByCategory} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
