import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'

export const Route = createFileRoute('/changelog')({
  component: ChangelogLayout,
})

function ChangelogLayout() {
  return (
    <div className="py-12">
      <Container size="md">
        <Outlet />
      </Container>
    </div>
  )
}
