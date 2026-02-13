import { createFileRoute } from '@tanstack/react-router'
import { HeroModern } from '@/components/landing/HeroModern'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { UseCases } from '@/components/landing/UseCases'
import { Screenshots } from '@/components/landing/Screenshots'
import { CTASection } from '@/components/landing/CTASection'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'Askify — Powerful Slack Polls Made Simple',
      },
      {
        name: 'description',
        content:
          'Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results. Free and open-source.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://askify.jnahian.me',
      },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <div>
      <HeroModern />
      <FeaturesGrid />
      <HowItWorks />
      <UseCases />
      <Screenshots />
      <CTASection />
    </div>
  )
}
