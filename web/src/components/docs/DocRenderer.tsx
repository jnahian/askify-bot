import { CodeBlock } from './CodeBlock'
import type { ContentBlock, DocSection } from '@/lib/content/schemas'
import { Alert } from '@/components/ui/Alert'
import { slugify } from '@/lib/utils'

interface DocRendererProps {
  sections: Array<DocSection>
}

export function DocRenderer({ sections }: DocRendererProps) {
  return (
    <div className="prose max-w-none">
      {sections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          id={slugify(section.heading)}
          className="mb-12"
        >
          {/* Section Heading with Anchor */}
          <h2 className="group flex items-center gap-2">
            <span>{section.heading}</span>
            <a
              href={`#${slugify(section.heading)}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--brand)] no-underline"
              aria-label={`Link to ${section.heading}`}
            >
              #
            </a>
          </h2>

          {/* Section Content Blocks */}
          {section.content.map((block, blockIndex) => (
            <ContentBlockRenderer key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  )
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p>{block.text}</p>

    case 'code':
      return <CodeBlock code={block.value} language={block.language} />

    case 'list':
      if (block.ordered) {
        return (
          <ol>
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        )
      }
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'note':
      return <Alert variant="info">{block.text}</Alert>

    case 'warning':
      return <Alert variant="warning">{block.text}</Alert>

    case 'heading':
      const level = block.level || 2
      if (level === 1) return <h1>{block.text}</h1>
      if (level === 2) return <h2>{block.text}</h2>
      if (level === 3) return <h3>{block.text}</h3>
      if (level === 4) return <h4>{block.text}</h4>
      if (level === 5) return <h5>{block.text}</h5>
      return <h6>{block.text}</h6>

    default:
      return null
  }
}
