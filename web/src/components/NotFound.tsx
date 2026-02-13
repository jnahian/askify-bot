import { Link } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="py-20">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number */}
          <div className="text-8xl font-bold mb-4">
            <span className="gradient-text">404</span>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" href="/">
              Go to Homepage
            </Button>
            <Button variant="secondary" href="/docs">
              Browse Documentation
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to="/docs/$id"
                params={{ id: 'getting-started' }}
                className="text-[var(--brand)] hover:underline"
              >
                Getting Started
              </Link>
              <Link
                to="/docs/$id"
                params={{ id: 'commands' }}
                className="text-[var(--brand)] hover:underline"
              >
                Commands
              </Link>
              <Link
                to="/changelog"
                className="text-[var(--brand)] hover:underline"
              >
                Changelog
              </Link>
              <a
                href="https://github.com/jnahian/askify-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
