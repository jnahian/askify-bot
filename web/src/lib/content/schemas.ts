import { z } from 'zod'

/**
 * Content Block Schemas
 * Discriminated union for different content types
 */

export const ParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
})

export const CodeBlockSchema = z.object({
  type: z.literal('code'),
  language: z.string(),
  value: z.string(),
})

export const ListBlockSchema = z.object({
  type: z.literal('list'),
  items: z.array(z.string()),
  ordered: z.boolean().optional().default(false),
})

export const NoteBlockSchema = z.object({
  type: z.literal('note'),
  text: z.string(),
})

export const WarningBlockSchema = z.object({
  type: z.literal('warning'),
  text: z.string(),
})

export const HeadingBlockSchema = z.object({
  type: z.literal('heading'),
  text: z.string(),
  level: z.number().min(1).max(6).default(2),
})

// Discriminated union of all content block types
export const ContentBlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  CodeBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  WarningBlockSchema,
  HeadingBlockSchema,
])

/**
 * Documentation Schema
 */

export const DocSectionSchema = z.object({
  heading: z.string(),
  content: z.array(ContentBlockSchema),
})

export const DocSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  order: z.number(),
  sections: z.array(DocSectionSchema),
})

export const DocsArraySchema = z.array(DocSchema)

/**
 * Changelog Schema
 */

export const ChangelogItemSchema = z.object({
  type: z.enum(['feature', 'improvement', 'fix', 'breaking']),
  text: z.string(),
})

export const ChangelogSchema = z.object({
  version: z.string(),
  date: z.string(), // ISO date string
  type: z.enum(['feature', 'fix', 'improvement', 'breaking']),
  title: z.string(),
  items: z.array(ChangelogItemSchema),
})

export const ChangelogArraySchema = z.array(ChangelogSchema)

/**
 * TypeScript Types exported from schemas
 */

export type ContentBlock = z.infer<typeof ContentBlockSchema>
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>
export type CodeBlock = z.infer<typeof CodeBlockSchema>
export type ListBlock = z.infer<typeof ListBlockSchema>
export type NoteBlock = z.infer<typeof NoteBlockSchema>
export type WarningBlock = z.infer<typeof WarningBlockSchema>
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>

export type DocSection = z.infer<typeof DocSectionSchema>
export type Doc = z.infer<typeof DocSchema>

export type ChangelogItem = z.infer<typeof ChangelogItemSchema>
export type Changelog = z.infer<typeof ChangelogSchema>

/**
 * Grouped Docs by Category
 */
export interface DocsByCategory {
  category: string
  docs: Doc[]
}
