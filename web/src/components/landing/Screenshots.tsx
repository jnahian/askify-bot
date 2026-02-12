import { Container } from '@/components/layout/Container'

export function Screenshots() {
  const screenshots = [
    {
      title: 'Poll Creation Modal',
      description: 'Intuitive modal with all configuration options',
      image: '/assets/screenshots/poll-creation.png',
      alt: 'Askify poll creation modal showing question input, poll type selection, and settings',
    },
    {
      title: 'Active Poll in Channel',
      description: 'Beautiful real-time bar charts with emoji',
      image: '/assets/screenshots/active-poll.png',
      alt: 'Active poll message in Slack channel with colorful bar chart visualization',
    },
    {
      title: 'Results & Sharing',
      description: 'Formatted results with share options',
      image: '/assets/screenshots/results.png',
      alt: 'Poll results DM showing bar charts, percentages, and share results button',
    },
  ]

  return (
    <section className="py-20">
      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            See it in <span className="gradient-text">action</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Beautiful, intuitive interface designed for Slack
          </p>
        </div>

        {/* Screenshots Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="group">
              {/* Screenshot Image */}
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-md)] mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 aspect-[4/3] flex items-center justify-center group-hover:shadow-[var(--shadow-lg)] transition-shadow">
                {/* Placeholder for now - will be replaced with actual screenshots
                <div className="text-center p-8">
                  <div className="text-6xl mb-4 opacity-20">📸</div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Screenshot coming soon
                  </p>
                </div> */}
                {/* Uncomment when screenshots are ready: */}
                <img
                  src={screenshot.image}
                  alt={screenshot.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Caption */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {screenshot.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {screenshot.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note about screenshots */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Try it out:{' '}
              <a href="/docs/getting-started" className="underline font-medium">
                Install Askify
              </a>{' '}
              to see it in your Slack workspace
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}
