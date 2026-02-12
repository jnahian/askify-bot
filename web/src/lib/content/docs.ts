import { Doc, DocSchema, DocsByCategory } from './schemas'

/**
 * Explicit category order for documentation navigation
 */
const CATEGORY_ORDER = [
  'Introduction',
  'Core Features',
  'Advanced Features',
  'Reference',
]

/**
 * Load all documentation files
 * Returns validated and sorted docs
 */
export async function getAllDocs(): Promise<Doc[]> {
  // In development, we'll import JSON files directly
  // In production, this could be an API call or static import

  const docFiles = import.meta.glob('/content/docs/*.json', { eager: true })

  const docs: Doc[] = []

  for (const [path, module] of Object.entries(docFiles)) {
    try {
      const data = (module as any).default || module
      const validated = DocSchema.parse(data)
      docs.push(validated)
    } catch (error) {
      console.error(`Failed to parse doc at ${path}:`, error)
      throw new Error(`Invalid doc format at ${path}`)
    }
  }

  // Sort by category and order
  return docs.sort((a, b) => {
    if (a.category !== b.category) {
      const indexA = CATEGORY_ORDER.indexOf(a.category)
      const indexB = CATEGORY_ORDER.indexOf(b.category)
      // If both in the order map, use that order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // If only one is in the map, prioritize it
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      // Fall back to alphabetical for unknown categories
      return a.category.localeCompare(b.category)
    }
    return a.order - b.order
  })
}

/**
 * Get single doc by ID
 */
export async function getDocById(id: string): Promise<Doc | null> {
  const docs = await getAllDocs()
  return docs.find((doc) => doc.id === id) || null
}

/**
 * Group docs by category
 * Returns array of categories with their docs
 */
export async function getDocsByCategory(): Promise<DocsByCategory[]> {
  const docs = await getAllDocs()

  const grouped = docs.reduce((acc, doc) => {
    const existing = acc.find((g) => g.category === doc.category)
    if (existing) {
      existing.docs.push(doc)
    } else {
      acc.push({ category: doc.category, docs: [doc] })
    }
    return acc
  }, [] as DocsByCategory[])

  return grouped
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const docs = await getAllDocs()
  const categories = [...new Set(docs.map((doc) => doc.category))]
  return categories.sort()
}

/**
 * Get next and previous docs for navigation
 */
export async function getAdjacentDocs(currentId: string): Promise<{
  prev: Doc | null
  next: Doc | null
}> {
  const docs = await getAllDocs()
  const currentIndex = docs.findIndex((doc) => doc.id === currentId)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  return {
    prev: currentIndex > 0 ? docs[currentIndex - 1] : null,
    next: currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null,
  }
}

/**
 * Search docs by query (simple text search)
 */
export async function searchDocs(query: string): Promise<Doc[]> {
  const docs = await getAllDocs()
  const lowercaseQuery = query.toLowerCase()

  return docs.filter((doc) => {
    const searchableText = [
      doc.title,
      doc.description,
      doc.category,
      ...doc.sections.flatMap((section) => [
        section.heading,
        ...section.content.map((block) => {
          if ('text' in block) return block.text
          if ('value' in block) return block.value
          if ('items' in block) return block.items.join(' ')
          return ''
        }),
      ]),
    ].join(' ').toLowerCase()

    return searchableText.includes(lowercaseQuery)
  })
}
