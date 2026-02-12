/**
 * Slack OAuth URL for "Add to Slack" button
 * Uses VITE_SLACK_CLIENT_ID from environment variables
 */
export const SLACK_OAUTH_URL = `https://slack.com/oauth/v2/authorize?client_id=${
  import.meta.env.VITE_SLACK_CLIENT_ID || 'YOUR_CLIENT_ID'
}`
