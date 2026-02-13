import { Lock, Palmtree, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export function HeroModern() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/5 via-transparent to-[var(--accent)]/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--brand)] rounded-full blur-3xl opacity-5" />

      <Container size="xl" className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Open Source • MIT License
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1]">
              <span className="gradient-text">Powerful Slack Polls</span>
              <br />
              <span className="text-[var(--text-primary)]">Made Simple</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
              Team decisions, engagement, and feedback — all without leaving
              Slack.
              <span className="block mt-2">
                Four poll types, real-time results, and smart scheduling.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {/*   <Button
                href={SLACK_OAUTH_URL}
                variant="primary"
                size="lg"
                external
                className="group"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
                Add to Slack
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">
                  →
                </span>
              </Button> */}

              <Button variant="secondary" size="lg" href="/docs">
                View Documentation
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[var(--brand)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Fast & Lightweight</span>
              </div>
              <div className="flex items-center gap-2">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Self-Hosted</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Bot Animation */}
          <div className="relative lg:block">
            <div className="relative w-full max-w-2x mx-auto">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] rounded-3xl blur-3xl opacity-20 animate-pulse"></div>

              {/* Bot Visualization Container */}
              <div className="relative bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
                {/* Mock Slack Poll Message */}
                <div className="space-y-4">
                  {/* Poll Question */}
                  <div className="flex items-start gap-3">
                    <img
                      src="/logo.jpeg"
                      alt="Askify Bot"
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--text-primary)] mb-1">
                        Askify
                        <span className="ml-2 text-xs bg-[var(--bg-muted)] border border-[var(--border)] px-2 py-0.5 rounded">
                          APP
                        </span>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] mb-3">
                        just now
                      </div>
                      <div className="text-[var(--text-primary)] font-medium mb-4 flex items-center gap-2">
                        Where should we have the team offsite?
                        <Palmtree className="w-5 h-5 inline-block text-[var(--accent)]" />
                      </div>

                      {/* Poll Options with Animated Bars */}
                      <div className="space-y-2">
                        <PollOption
                          number={1}
                          label="Mountains"
                          percentage={45}
                          color="bg-green-500"
                        />
                        <PollOption
                          number={2}
                          label="Beach"
                          percentage={30}
                          color="bg-blue-500"
                          delay={100}
                        />
                        <PollOption
                          number={3}
                          label="City"
                          percentage={25}
                          color="bg-purple-500"
                          delay={200}
                        />
                      </div>

                      {/* Poll Footer */}
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span>20 votes • 3 options</span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                          Live results
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-[var(--brand)] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg animate-bounce flex items-center gap-1.5">
                  Real-time
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg flex items-center gap-1.5">
                  Anonymous
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// Poll Option Component with animated bar
function PollOption({
  number,
  label,
  percentage,
  color,
  delay = 0,
}: {
  number: number
  label: string
  percentage: number
  color: string
  delay?: number
}) {
  const [currentWidth, setCurrentWidth] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentWidth(percentage)
    }, delay)

    return () => clearTimeout(timeout)
  }, [percentage, delay])

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-[var(--text-primary)] font-medium flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-dark)]/20 text-xs font-semibold">
            {number}
          </span>
          {label}
        </span>
        <span className="text-[var(--text-secondary)] text-xs">
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-[var(--bg-dark)]/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{
            width: `${currentWidth}%`,
          }}
        />
      </div>
    </div>
  )
}
