import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '@/components/landing/Hero'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { UseCases } from '@/components/landing/UseCases'
import { Screenshots } from '@/components/landing/Screenshots'
import { CTASection } from '@/components/landing/CTASection'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div>
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <UseCases />
      <Screenshots />
      <CTASection />
    </div>
  )
}
