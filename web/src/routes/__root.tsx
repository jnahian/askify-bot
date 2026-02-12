import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

import globalsCss from '@/styles/globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Askify — Powerful Slack Polls Made Simple',
      },
      {
        name: 'description',
        content: 'Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: globalsCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/logo.PNG',
      },
    ],
  }),

  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
