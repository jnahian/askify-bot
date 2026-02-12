import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { Container } from './Container'

export function Footer() {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { href: '/#features', label: 'Features' },
        { href: '/docs', label: 'Documentation' },
        { href: '/changelog', label: 'Changelog' },
        { href: 'https://github.com/jnahian/askify-bot', label: 'GitHub', external: true },
      ],
    },
    {
      title: 'Resources',
      links: [
        { href: '/docs/getting-started', label: 'Getting Started' },
        { href: '/docs/commands', label: 'Commands' },
        { href: '/docs/poll-types', label: 'Poll Types' },
        { href: '/docs/architecture', label: 'Architecture' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: 'Terms of Service' },
        { href: '/privacy', label: 'Privacy Policy' },
      ],
    },
  ]

  return (
    <footer className="bg-[var(--bg-muted)] border-t border-[var(--border)] py-12">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity mb-4"
            >
              <img
                src="/logo.jpeg"
                alt="Askify"
                className="w-8 h-8 object-contain rounded-sm"
              />
              <span>Askify</span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Powerful Slack polls made simple. Team decisions, engagement, and
              feedback — all without leaving Slack.
            </p>
            <a
              href="https://github.com/jnahian/askify-bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">Open Source</span>
            </a>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) =>
                  link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            © {new Date().getFullYear()} Askify. MIT License.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Built with{' '}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              TanStack Start
            </a>
          </p>
        </div>
      </Container>
    </footer>
  )
}
