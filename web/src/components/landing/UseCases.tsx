import { CheckCircle2,  Pizza, Star, Target } from 'lucide-react'
import type {LucideIcon} from 'lucide-react';
import { Container } from '@/components/layout/Container'
import { Card, CardContent } from '@/components/ui/Card'

export function UseCases() {
  const useCases: Array<{
    icon: LucideIcon
    title: string
    description: string
    example: string
    pollType: string
    bgColor: string
  }> = [
    {
      icon: Target,
      title: 'Team Decisions',
      description: 'Strategic choices made easy',
      example: '"Where should we have the team offsite?"',
      pollType: 'Single choice with live results',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    },
    {
      icon: CheckCircle2,
      title: 'Quick Consensus',
      description: 'Fast feedback loops',
      example: '"Should we move standup to 10am?"',
      pollType: 'Yes/No/Maybe with auto-close',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    },
    {
      icon: Star,
      title: 'Feedback Collection',
      description: 'Measure satisfaction',
      example: '"Rate this sprint (1-5)"',
      pollType: 'Rating scale with average display',
      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    },
    {
      icon: Pizza,
      title: 'Engagement & Fun',
      description: 'Build team culture',
      example: '"What\'s for lunch today?"',
      pollType: 'Multi-select with anonymous voting',
      bgColor: 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
    },
  ]

  return (
    <section className="py-20 bg-[var(--bg-muted)]">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            Built for every <span className="gradient-text">use case</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            From critical decisions to casual team building — Askify adapts to your needs
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} hover noPadding>
              <div className={`p-6 bg-gradient-to-br ${useCase.bgColor} border-b border-[var(--border)]`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <useCase.icon className="w-10 h-10 text-[var(--text-primary)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Example Question */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Example:
                  </div>
                  <div className="text-[var(--text-primary)] font-medium italic bg-[var(--bg-muted)] px-4 py-3 rounded-lg border border-[var(--border)]">
                    {useCase.example}
                  </div>
                </div>

                {/* Poll Type */}
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-[var(--brand)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[var(--text-secondary)]">{useCase.pollType}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-[var(--text-secondary)] mb-4">
            And many more scenarios — anonymous voting, scheduled polls, templates, and reminders
          </p>
          <a
            href="/docs/poll-types"
            className="text-[var(--brand)] hover:text-[var(--accent)] font-medium inline-flex items-center gap-1 transition-colors"
          >
            Explore all poll types
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </Container>
    </section>
  )
}
