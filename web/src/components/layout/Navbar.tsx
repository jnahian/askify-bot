import { Button } from '@/components/ui/Button'
import { Link } from '@tanstack/react-router'
import { Github, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Container } from './Container'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/docs', label: 'Docs' },
    { href: '/changelog', label: 'Changelog' },
    {
      href: 'https://github.com/jnahian/askify-bot',
      label: 'GitHub',
      external: true,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.jpeg"
              alt="Askify"
              className="w-8 h-8 object-contain rounded-lg"
            />
            <span>Askify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                >
                  {link.label}
                  {link.label === 'GitHub' && <Github className="w-4 h-4" />}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  activeProps={{
                    className: 'text-[var(--brand)] font-medium',
                  }}
                >
                  {link.label}
                </Link>
              ),
            )}

            {/* CTA Button */}
            <Button
              href="https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID"
              variant="primary"
              size="sm"
            >
              Add to Slack
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border)]">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
                    activeProps={{
                      className: 'text-[var(--brand)] font-medium',
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ),
              )}

              <Button
                href="https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID"
                variant="primary"
                size="sm"
                className="w-full"
              >
                Add to Slack
              </Button>
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}
