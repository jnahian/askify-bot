import { InteractivePoll } from '@/components/landing/interactive/InteractivePoll'
import { InteractivePollCreation } from '@/components/landing/interactive/InteractivePollCreation'
import { InteractiveResults } from '@/components/landing/interactive/InteractiveResults'
import { Container } from '@/components/layout/Container'

export function Screenshots() {
  const demos = [
    {
      title: 'Poll Creation Modal',
      description: 'Intuitive modal with all configuration options',
      component: InteractivePollCreation,
    },
    {
      title: 'Active Poll in Channel',
      description: 'Beautiful real-time bar charts with emoji',
      component: InteractivePoll,
    },
    {
      title: 'Results & Sharing',
      description: 'Formatted results with share options',
      component: InteractiveResults,
    },
  ]

  return (
    <section className="py-20 bg-[var(--bg-muted)]">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            See it in <span className="gradient-text">action</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Interactive demos — try clicking and interacting with each component
          </p>
        </div>

        {/* Interactive Demos Grid */}
        <div className="grid lg:grid-cols-3 gap-12">
          {demos.map((demo, index) => {
            const Component = demo.component
            return (
              <div key={index} className="space-y-4">
                {/* Interactive Component */}
                <div className="flex items-center justify-center">
                  <Component />
                </div>

                {/* Caption */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {demo.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
            <svg
              className="w-5 h-5 text-[var(--brand)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-900 dark:text-gray-100">
              These are live demos!{' '}
              <a
                href="/docs/getting-started"
                className="underline font-semibold text-[var(--brand)] hover:text-[var(--accent)] transition-colors"
              >
                Install Askify
              </a>{' '}
              to use it in your Slack workspace
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}
