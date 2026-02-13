import type { Changelog } from '@/lib/content/schemas'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

interface ChangelogItemProps {
  changelog: Changelog
  isLatest?: boolean
}

export function ChangelogItem({ changelog, isLatest }: ChangelogItemProps) {
  return (
    <Card className={isLatest ? 'border-2 border-[var(--brand)]' : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              v{changelog.version}
            </h2>
            {isLatest && (
              <Badge
                variant="version"
                className="bg-[var(--brand)] text-white border-[var(--brand)]"
              >
                Latest
              </Badge>
            )}
          </div>
          <time className="text-sm text-[var(--text-secondary)]">
            {formatDate(changelog.date)}
          </time>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {changelog.title}
        </h3>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {changelog.items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <Badge variant={item.type} className="mt-0.5 flex-shrink-0">
                {item.type}
              </Badge>
              <span className="text-[var(--text-primary)] leading-relaxed flex-1">
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
