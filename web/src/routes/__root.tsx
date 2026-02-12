import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { NotFound } from '@/components/NotFound'

import globalsCss from '@/styles/globals.css?url'

export const Route = createRootRoute({
  notFoundComponent: NotFound,
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
        content:
          'Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results. Free and open-source.',
      },
      {
        name: 'keywords',
        content:
          'slack polls, slack bot, team voting, slack survey, poll bot, team decisions, slack app, open source',
      },
      {
        name: 'author',
        content: 'Askify',
      },
      // Open Graph
      {
        property: 'og:title',
        content: 'Askify — Powerful Slack Polls Made Simple',
      },
      {
        property: 'og:description',
        content:
          'Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://askify.jnahian.me',
      },
      {
        property: 'og:image',
        content: 'https://askify.jnahian.me/assets/og-images/default.png',
      },
      {
        property: 'og:site_name',
        content: 'Askify',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Askify — Powerful Slack Polls Made Simple',
      },
      {
        name: 'twitter:description',
        content:
          'Create interactive polls in Slack with 4 poll types, anonymous voting, and visual results.',
      },
      {
        name: 'twitter:image',
        content: 'https://askify.jnahian.me/assets/og-images/default.png',
      },
      // Theme color
      {
        name: 'theme-color',
        content: '#0f9ea8',
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
      {
        rel: 'canonical',
        href: 'https://askify.jnahian.me',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
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
    <html lang="en" className="dark">
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
