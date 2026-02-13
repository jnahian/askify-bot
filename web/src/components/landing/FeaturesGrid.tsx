import { Container } from '@/components/layout/Container'
import { Card } from '@/components/ui/Card'
import {
  ListChecks,
  BarChart3,
  Lock,
  CalendarClock,
  FolderKanban,
  Share2,
  RefreshCw,
} from 'lucide-react'

export function FeaturesGrid() {
  const features = [
    {
      icon: ListChecks,
      title: '4 Poll Types',
      description:
        'Single choice, multi-select, yes/no/maybe, and rating scales (1-5 or 1-10). Choose the perfect format for any decision.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Results',
      description:
        'Live bar charts with color-coded emoji and instant updates. Watch votes come in with beautiful visual feedback.',
    },
    {
      icon: Lock,
      title: 'Anonymous Voting',
      description:
        'Keep voter identities private while tracking votes for deduplication. Perfect for sensitive decisions.',
    },
    {
      icon: CalendarClock,
      title: 'Smart Scheduling',
      description:
        'Schedule polls for future posting and set auto-close with duration or specific date/time. Reminder DMs keep voters engaged.',
    },
    {
      icon: RefreshCw,
      title: 'Poll Management',
      description:
        'Edit scheduled polls, repost closed polls as fresh copies, and schedule recurring polls. Save as templates and let voters add options.',
    },
    {
      icon: Share2,
      title: 'Share Results',
      description:
        'Post formatted results to any channel with beautiful bar charts. DM results to creators automatically on close.',
    },
  ]

  return (
    <section className="py-20 bg-[var(--bg-muted)]">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            Everything you need for{' '}
            <span className="gradient-text">team decisions</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Powerful features that make polling simple, engaging, and effective
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} hover className="group">
                <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
