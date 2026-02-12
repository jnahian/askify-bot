import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/')({
  beforeLoad: () => {
    // Redirect /docs to /docs/getting-started
    throw redirect({
      to: '/docs/$id',
      params: { id: 'getting-started' },
    })
  },
})
