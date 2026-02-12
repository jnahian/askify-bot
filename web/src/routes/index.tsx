import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="py-20">
      <Container>
        {/* Hero Section - Temporary */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Powerful Slack Polls</span>
            <br />
            Made Simple
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            Team decisions, engagement, and feedback — all without leaving Slack
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              Add to Slack
            </Button>
            <Button variant="secondary" size="lg" href="/docs">
              View Documentation
            </Button>
          </div>
        </div>

        {/* Features Grid - Temporary */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card hover>
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-semibold mb-2">4 Poll Types</h3>
            <p className="text-[var(--text-secondary)]">
              Single choice, multi-select, yes/no/maybe, and rating scales
            </p>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
            <p className="text-[var(--text-secondary)]">
              Live bar charts with color-coded emoji and instant updates
            </p>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Anonymous Voting</h3>
            <p className="text-[var(--text-secondary)]">
              Keep voter identities private while tracking votes
            </p>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-[var(--text-secondary)]">
              Schedule polls and auto-close with reminders
            </p>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Templates</h3>
            <p className="text-[var(--text-secondary)]">
              Save and reuse poll configurations
            </p>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2">Share Results</h3>
            <p className="text-[var(--text-secondary)]">
              Post formatted results to any channel
            </p>
          </Card>
        </div>

        {/* Temporary Status Note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            ✅ Phase 0 Complete: Foundation & UI Components Ready
            <br />
            📝 Next: Landing Page Content (Phase 1)
          </p>
        </div>
      </Container>
    </div>
  )
}
