import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      {
        title: 'Terms of Service — Askify',
      },
      {
        name: 'description',
        content:
          'Terms of Service for Askify Slack bot. Read our terms and conditions for using Askify.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://askify.jnahian.me/terms',
      },
    ],
  }),
  component: TermsPage,
})

function TermsPage() {
  const lastUpdated = '2026-02-12'

  return (
    <div className="py-12">
      <Container size="md">
        <article className="prose max-w-none">
          {/* Header */}
          <header className="mb-8 pb-6 border-b border-[var(--border)]">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
              Terms of Service
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Last Updated: {lastUpdated}
            </p>
          </header>

          {/* Table of Contents */}
          <div className="bg-[var(--bg-muted)] rounded-lg p-6 mb-8 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2 text-sm">
              <li>
                <a
                  href="#acceptance"
                  className="text-[var(--brand)] hover:underline"
                >
                  1. Acceptance of Terms
                </a>
              </li>
              <li>
                <a
                  href="#license"
                  className="text-[var(--brand)] hover:underline"
                >
                  2. Use License
                </a>
              </li>
              <li>
                <a
                  href="#service-description"
                  className="text-[var(--brand)] hover:underline"
                >
                  3. Service Description
                </a>
              </li>
              <li>
                <a
                  href="#user-responsibilities"
                  className="text-[var(--brand)] hover:underline"
                >
                  4. User Responsibilities
                </a>
              </li>
              <li>
                <a
                  href="#modifications"
                  className="text-[var(--brand)] hover:underline"
                >
                  5. Modifications to Service
                </a>
              </li>
              <li>
                <a
                  href="#limitations"
                  className="text-[var(--brand)] hover:underline"
                >
                  6. Limitations of Liability
                </a>
              </li>
              <li>
                <a
                  href="#termination"
                  className="text-[var(--brand)] hover:underline"
                >
                  7. Termination
                </a>
              </li>
              <li>
                <a
                  href="#governing-law"
                  className="text-[var(--brand)] hover:underline"
                >
                  8. Governing Law
                </a>
              </li>
            </ol>
          </div>

          {/* Content Sections */}
          <section id="acceptance" className="mb-8">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By installing, accessing, or using Askify (the "Service"), you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the Service.
            </p>
            <p>
              Askify is an open-source Slack application designed for internal
              team use. These terms govern your use of the bot within your Slack
              workspace.
            </p>
          </section>

          <section id="license" className="mb-8">
            <h2>2. Use License</h2>
            <p>
              Askify is provided under the MIT License. You are granted
              permission to use, copy, modify, merge, publish, distribute,
              sublicense, and/or sell copies of the software, subject to the
              following conditions:
            </p>
            <ul>
              <li>
                The above copyright notice and this permission notice shall be
                included in all copies or substantial portions of the software.
              </li>
              <li>
                The software is provided "as is", without warranty of any kind,
                express or implied.
              </li>
            </ul>
            <p>
              You may self-host Askify on your own infrastructure. You are
              responsible for maintaining your deployment and ensuring
              compliance with Slack's API Terms of Service.
            </p>
          </section>

          <section id="service-description" className="mb-8">
            <h2>3. Service Description</h2>
            <p>
              Askify is a Slack bot that provides the following functionality:
            </p>
            <ul>
              <li>Creation and management of polls within Slack channels</li>
              <li>
                Four poll types: single choice, multi-select, yes/no/maybe, and
                rating scales
              </li>
              <li>Voting with real-time results visualization</li>
              <li>Scheduled polls and automatic closing</li>
              <li>Poll templates for recurring use cases</li>
              <li>Anonymous voting and voter management</li>
              <li>Results sharing and distribution</li>
            </ul>
            <p>
              The Service operates within your Slack workspace using Socket Mode
              and does not require exposing public endpoints.
            </p>
          </section>

          <section id="user-responsibilities" className="mb-8">
            <h2>4. User Responsibilities</h2>
            <p>As a user of Askify, you agree to:</p>
            <ul>
              <li>
                Use the Service in compliance with all applicable laws and
                regulations
              </li>
              <li>
                Not use the Service to collect sensitive personal information
                without proper consent
              </li>
              <li>
                Respect your team members' privacy when creating polls and
                viewing results
              </li>
              <li>
                Not attempt to circumvent any security features or access
                controls
              </li>
              <li>
                Not use the Service to spam, harass, or abuse other workspace
                members
              </li>
              <li>
                Maintain the confidentiality of your Slack workspace credentials
              </li>
            </ul>
            <p>
              Poll creators are responsible for the content of their polls and
              ensuring compliance with their organization's policies.
            </p>
          </section>

          <section id="modifications" className="mb-8">
            <h2>5. Modifications to Service</h2>
            <p>
              As an open-source project, Askify may be updated, modified, or
              enhanced at any time. We reserve the right to:
            </p>
            <ul>
              <li>Add, modify, or remove features</li>
              <li>Update the software to address bugs or security issues</li>
              <li>Change the Service's functionality or user interface</li>
            </ul>
            <p>
              Since Askify is self-hosted, you control when to deploy updates.
              We recommend staying up to date with the latest releases for
              security patches and new features.
            </p>
          </section>

          <section id="limitations" className="mb-8">
            <h2>6. Limitations of Liability</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. IN
              NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
              CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THE
              SERVICE.
            </p>
            <p>Specifically, we are not liable for:</p>
            <ul>
              <li>Data loss or corruption</li>
              <li>Service downtime or unavailability</li>
              <li>Unauthorized access to your data</li>
              <li>Errors or inaccuracies in poll results</li>
              <li>Any damages resulting from your use of the Service</li>
            </ul>
            <p>
              You are responsible for maintaining backups of your data and
              ensuring the security of your self-hosted deployment.
            </p>
          </section>

          <section id="termination" className="mb-8">
            <h2>7. Termination</h2>
            <p>You may terminate your use of Askify at any time by:</p>
            <ul>
              <li>Uninstalling the Slack app from your workspace</li>
              <li>Stopping your self-hosted deployment</li>
              <li>Deleting all poll data from your database</li>
            </ul>
            <p>
              Termination does not affect any rights or obligations that accrued
              prior to termination.
            </p>
          </section>

          <section id="governing-law" className="mb-8">
            <h2>8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of your jurisdiction, without regard to conflict of law
              principles.
            </p>
            <p>
              Any disputes arising from these Terms or your use of the Service
              shall be resolved through good faith negotiation or, if necessary,
              through appropriate legal channels in your jurisdiction.
            </p>
          </section>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Questions about these terms? Contact us via{' '}
              <a
                href="https://github.com/jnahian/askify-bot/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] hover:underline"
              >
                GitHub Issues
              </a>
              .
            </p>
          </footer>
        </article>
      </Container>
    </div>
  )
}
