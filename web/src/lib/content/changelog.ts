import { ChangelogSchema } from './schemas'
import type { Changelog} from './schemas';

/**
 * Load all changelog entries
 * Returns validated and sorted (reverse chronological) changelogs
 */
export async function getAllChangelogs(): Promise<Array<Changelog>> {
  const changelogFiles = import.meta.glob('/content/changelog/*.json', {
    eager: true,
  })

  const changelogs: Array<Changelog> = []

  for (const [path, module] of Object.entries(changelogFiles)) {
    try {
      const data = (module as any).default || module
      const validated = ChangelogSchema.parse(data)
      changelogs.push(validated)
    } catch (error) {
      console.error(`Failed to parse changelog at ${path}:`, error)
      throw new Error(`Invalid changelog format at ${path}`)
    }
  }

  // Sort reverse chronological (newest first), then by version if dates are equal
  return changelogs.sort((a, b) => {
    const dateComparison =
      new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateComparison !== 0) {
      return dateComparison
    }
    // If dates are equal, sort by semantic version (newest first)
    return isNewerVersion(b.version, a.version) ? 1 : -1
  })
}

/**
 * Get single changelog entry by version
 */
export async function getChangelogByVersion(
  version: string,
): Promise<Changelog | null> {
  const changelogs = await getAllChangelogs()
  return changelogs.find((changelog) => changelog.version === version) || null
}

/**
 * Get latest changelog entry
 */
export async function getLatestChangelog(): Promise<Changelog | null> {
  const changelogs = await getAllChangelogs()
  return changelogs[0] || null
}

/**
 * Filter changelogs by type
 */
export async function getChangelogsByType(
  type: Changelog['type'],
): Promise<Array<Changelog>> {
  const changelogs = await getAllChangelogs()
  return changelogs.filter((changelog) => changelog.type === type)
}

/**
 * Get all versions (just version strings)
 */
export async function getAllVersions(): Promise<Array<string>> {
  const changelogs = await getAllChangelogs()
  return changelogs.map((changelog) => changelog.version)
}

/**
 * Get changelog summary for SEO description
 * Returns first 2-3 items as a text string
 */
export function getChangelogSummary(changelog: Changelog): string {
  const items = changelog.items.slice(0, 3)
  return items.map((item) => item.text).join('. ') + '.'
}

/**
 * Compare two semantic versions
 * Returns true if v1 is newer than v2
 */
export function isNewerVersion(v1: string, v2: string): boolean {
  const parse = (v: string) => {
    const parts = v.replace(/^v/, '').split('.')
    // Pad to 3 segments with '0' for missing parts
    return [parts[0] || '0', parts[1] || '0', parts[2] || '0'].map(Number)
  }
  const [major1, minor1, patch1] = parse(v1)
  const [major2, minor2, patch2] = parse(v2)

  if (major1 !== major2) return major1 > major2
  if (minor1 !== minor2) return minor1 > minor2
  return patch1 > patch2
}
