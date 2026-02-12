import { createFileRoute } from '@tanstack/react-router'
import { Container } from '@/components/layout/Container'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      {
        title: 'Privacy Policy — Askify',
      },
      {
        name: 'description',
        content: 'Privacy Policy for Askify Slack bot. Learn how we collect, use, and protect your data.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://askify.jnahian.me/privacy',
      },
    ],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  const lastUpdated = '2026-02-12'

  return (
    <div className="py-12">
      <Container size="md">
        <article className="prose max-w-none">
          {/* Header */}
          <header className="mb-8 pb-6 border-b border-[var(--border)]">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
              Privacy Policy
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
                <a href="#overview" className="text-[var(--brand)] hover:underline">
                  1. Overview
                </a>
              </li>
              <li>
                <a href="#data-collection" className="text-[var(--brand)] hover:underline">
                  2. Data Collection
                </a>
              </li>
              <li>
                <a href="#data-usage" className="text-[var(--brand)] hover:underline">
                  3. Data Usage
                </a>
              </li>
              <li>
                <a href="#data-storage" className="text-[var(--brand)] hover:underline">
                  4. Data Storage
                </a>
              </li>
              <li>
                <a href="#anonymous-voting" className="text-[var(--brand)] hover:underline">
                  5. Anonymous Voting
                </a>
              </li>
              <li>
                <a href="#user-rights" className="text-[var(--brand)] hover:underline">
                  6. User Rights
                </a>
              </li>
              <li>
                <a href="#security" className="text-[var(--brand)] hover:underline">
                  7. Security
                </a>
              </li>
              <li>
                <a href="#contact" className="text-[var(--brand)] hover:underline">
                  8. Contact Information
                </a>
              </li>
            </ol>
          </div>

          {/* Content Sections */}
          <section id="overview" className="mb-8">
            <h2>1. Overview</h2>
            <p>
              Askify is a self-hosted Slack bot designed for internal team polling. This Privacy
              Policy explains what data we collect, how we use it, and your rights regarding your
              data.
            </p>
            <p>
              Because Askify is self-hosted, you maintain full control over where and how your data
              is stored. This policy describes the data handling practices of the Askify application
              itself.
            </p>
          </section>

          <section id="data-collection" className="mb-8">
            <h2>2. Data Collection</h2>
            <p>Askify collects and stores the following data to provide poll functionality:</p>

            <h3>Poll Data</h3>
            <ul>
              <li>Poll questions and descriptions</li>
              <li>Poll options and configuration settings</li>
              <li>Poll type (single choice, multi-select, yes/no/maybe, rating)</li>
              <li>Target channel IDs and message timestamps</li>
              <li>Poll creator user ID</li>
              <li>Scheduled and close timestamps</li>
            </ul>

            <h3>Vote Data</h3>
            <ul>
              <li>Voter user IDs (Slack user IDs)</li>
              <li>Selected options</li>
              <li>Vote timestamps</li>
            </ul>

            <h3>Template Data</h3>
            <ul>
              <li>Template name and configuration</li>
              <li>Template owner user ID</li>
              <li>Creation timestamps</li>
            </ul>

            <h3>Workspace Data</h3>
            <ul>
              <li>Workspace ID</li>
              <li>Channel IDs</li>
              <li>User IDs (for poll creators and voters)</li>
            </ul>

            <p className="font-semibold">What We DO NOT Collect:</p>
            <ul>
              <li>Message content outside of poll interactions</li>
              <li>Personal information beyond Slack user IDs</li>
              <li>Email addresses or contact information</li>
              <li>Financial or payment information</li>
              <li>Conversation history or channel messages</li>
            </ul>
          </section>

          <section id="data-usage" className="mb-8">
            <h2>3. Data Usage</h2>
            <p>We use the collected data solely to:</p>
            <ul>
              <li>Create and display polls in Slack channels</li>
              <li>Record and tally votes</li>
              <li>Generate and display poll results</li>
              <li>Prevent duplicate voting (vote deduplication)</li>
              <li>Send reminder DMs to non-voters (when enabled)</li>
              <li>Send results DMs to poll creators</li>
              <li>Manage scheduled polls and auto-close functionality</li>
              <li>Store and load poll templates</li>
            </ul>
            <p>
              We do not use your data for advertising, marketing, or any purpose outside of
              providing poll functionality.
            </p>
          </section>

          <section id="data-storage" className="mb-8">
            <h2>4. Data Storage</h2>
            <p>
              Since Askify is self-hosted, all data is stored in your own PostgreSQL database. You
              have full control over:
            </p>
            <ul>
              <li>Where your data is physically located</li>
              <li>Who has access to the database</li>
              <li>Data retention policies</li>
              <li>Backup and recovery procedures</li>
              <li>Security configurations</li>
            </ul>
            <p>
              We recommend using a managed database service like Supabase for security, backups, and
              reliability. Ensure your database follows industry-standard security practices,
              including encryption at rest and in transit.
            </p>
          </section>

          <section id="anonymous-voting" className="mb-8">
            <h2>5. Anonymous Voting</h2>
            <p>When anonymous voting is enabled on a poll:</p>
            <ul>
              <li>
                Voter user IDs are stored in the database for vote deduplication (to prevent voting
                multiple times)
              </li>
              <li>Voter names are NOT displayed in poll results messages</li>
              <li>Voter names are NOT displayed in results DMs or shared results</li>
              <li>Only vote counts and percentages are shown</li>
              <li>The poll creator cannot see who voted for which option</li>
            </ul>
            <p>
              Anonymous voting protects voter privacy while maintaining poll integrity by preventing
              duplicate votes.
            </p>
          </section>

          <section id="user-rights" className="mb-8">
            <h2>6. User Rights</h2>
            <p>You have the following rights regarding your data:</p>

            <h3>Access Your Data</h3>
            <ul>
              <li>Use /askify list to view all polls you've created</li>
              <li>View your votes within poll messages</li>
              <li>Access your templates via /askify templates</li>
            </ul>

            <h3>Delete Your Data</h3>
            <ul>
              <li>Close polls to disable voting (polls remain in database)</li>
              <li>Delete templates individually</li>
              <li>
                Contact your workspace administrator to remove poll data from the database directly
              </li>
            </ul>

            <h3>Retract Votes</h3>
            <ul>
              <li>Click the same vote button to retract your vote (if vote change is enabled)</li>
              <li>Your vote is removed from the poll immediately</li>
            </ul>

            <h3>Uninstall</h3>
            <ul>
              <li>Uninstalling the Askify Slack app stops data collection immediately</li>
              <li>
                Existing data remains in your database until manually deleted by your administrator
              </li>
            </ul>
          </section>

          <section id="security" className="mb-8">
            <h2>7. Security</h2>
            <p>Askify implements the following security measures:</p>
            <ul>
              <li>
                Request verification using Slack's signing secret to prevent unauthorized access
              </li>
              <li>Socket Mode communication (no public endpoints required)</li>
              <li>Parameterized database queries to prevent SQL injection</li>
              <li>Environment-based credential management (never hardcoded)</li>
              <li>Vote deduplication to maintain poll integrity</li>
            </ul>
            <p>
              As a self-hosted application, you are responsible for securing your deployment,
              including:
            </p>
            <ul>
              <li>Keeping environment variables and API tokens secure</li>
              <li>Maintaining database security and access controls</li>
              <li>Updating to the latest Askify version for security patches</li>
              <li>Following Slack's security best practices</li>
            </ul>
          </section>

          <section id="contact" className="mb-8">
            <h2>8. Contact Information</h2>
            <p>
              For questions, concerns, or requests regarding this Privacy Policy or your data,
              please contact us:
            </p>
            <ul>
              <li>
                GitHub Issues:{' '}
                <a
                  href="https://github.com/jnahian/askify-bot/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] hover:underline"
                >
                  github.com/jnahian/askify-bot/issues
                </a>
              </li>
              <li>
                GitHub Repository:{' '}
                <a
                  href="https://github.com/jnahian/askify-bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] hover:underline"
                >
                  github.com/jnahian/askify-bot
                </a>
              </li>
            </ul>
            <p>
              Since Askify is open-source and self-hosted, your workspace administrator has primary
              responsibility for data management and user privacy within your organization.
            </p>
          </section>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-[var(--border)]">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                Self-Hosted Privacy Notice
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Askify is fully self-hosted on your infrastructure. No data is sent to external
                servers, third-party services, or the Askify developers. Your workspace
                administrator has complete control over data storage, access, and retention.
              </p>
            </div>
          </footer>
        </article>
      </Container>
    </div>
  )
}
