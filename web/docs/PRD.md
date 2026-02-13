# Askify Website PRD

**Framework:** TanStack Start  
**Language:** TypeScript  
**Styling:** Tailwind v4  
**Content Source:** Local JSON files  
**Scope:** Landing + Docs + Changelog + Terms + Privacy

---

# 1. Objective

Build a fast, structured, SEO-friendly website where:

- Landing page is component-driven
- Docs and changelog are powered by structured JSON
- Legal pages are static routes
- Content updates do not require complex parsing (MDX avoided)

---

# 2. Information Architecture

```
/
|-- /docs
|     |-- /:slug
|
|-- /changelog
|     |-- /:version
|
|-- /terms
|-- /privacy
```

---

# 3. JSON Data Structure

---

## 3.1 Documentation JSON Structure

### File: `content/docs.json`

```json
[
  {
    "id": "getting-started",
    "title": "Getting Started",
    "description": "Install and configure Askify in Slack.",
    "category": "Introduction",
    "order": 1,
    "sections": [
      {
        "heading": "Installation",
        "content": [
          {
            "type": "paragraph",
            "text": "Click the Add to Slack button..."
          },
          {
            "type": "code",
            "language": "bash",
            "value": "/askify create poll"
          }
        ]
      }
    ]
  }
]
```

---

### Functional Requirements (Docs)

- Sidebar auto-generated from JSON
- Sorted by category + order
- Route: `/docs/:id`
- Active state highlighting
- SEO meta generated from JSON title/description
- Code block rendering
- Anchor link support for sections

---

## 3.2 Changelog JSON Structure

### File: `content/changelog.json`

```json
[
  {
    "version": "1.2.0",
    "date": "2026-02-10",
    "type": "feature",
    "title": "Anonymous Polls Released",
    "items": [
      {
        "type": "feature",
        "text": "Users can now create anonymous polls."
      },
      {
        "type": "improvement",
        "text": "Improved slash command performance."
      }
    ]
  }
]
```

---

### Functional Requirements (Changelog)

- Reverse chronological sorting
- Filter by type (future-ready)
- Highlight latest version
- Version badge styling
- SEO-friendly version pages
- Route: `/changelog/:version`

---

# 4. Landing Page Requirements

### Objective

Drive Slack installs.

### Required Sections

- Hero (Headline + CTA)
- Features grid
- How it works
- Use cases
- Screenshots
- Final CTA
- Footer

### Functional

- Responsive
- SEO optimized
- Dark mode support
- Open Graph support

---

# 5. Legal Pages

## Terms & Privacy

Since these are legal documents:

Two possible approaches:

### Option A (Recommended)

Keep as static route components with structured sections.

### Option B

Use `legal.json` with structured blocks.

Example:

```json
{
  "lastUpdated": "2026-02-01",
  "sections": [
    {
      "title": "Data Collection",
      "content": [
        "We collect workspace ID...",
        "We do not store message content..."
      ]
    }
  ]
}
```

---

# 6. Technical Architecture

---

## 6.1 Content Layer

Create a content utility:

```ts
;/lib/cennott.ts
```

Responsibilities:

- Load JSON
- Validate shape (using Zod recommended)
- Sort docs
- Group by category
- Get doc by ID
- Get changelog by version

---

## 6.2 Type Definitions

Example:

```ts
export interface DocSection {
  heading: string
  content: ContentBlock[]
}

export interface DocPage {
  id: string
  title: string
  description: string
  category: string
  order: number
  sections: DocSection[]
}
```

---

# 7. SEO Strategy

For each route:

### Docs

- Title = doc.title
- Description = doc.description
- Canonical = /docs/:id

### Changelog

- Title = "Askify vX.X.X"
- Description = Auto-generate summary from items

---

# 8. Search Strategy (Future Ready)

Since content is JSON:

You can easily:

- Pre-index content
- Build client-side search
- Migrate to API
- Plug into Algolia / Pagefind later

---

# 9. Non-Functional Requirements

- Lighthouse 90+
- No hydration mismatch
- Bundle optimized
- Accessible components
- Keyboard navigation

---

# 10. Risks

### 1. Large JSON File Growth

Mitigation:

- Split per file (`docs/getting-started.json`)

### 2. Formatting Limitations

Mitigation:

- Support limited rich text blocks:
  - paragraph
  - list
  - code
  - note
  - warning

---

# 11. Future Scalability

Because content is JSON:

You can later:

- Move to headless CMS
- Serve from API
- Add versioned docs
- Add search indexing
- Add public API docs

---

# 12. Recommended Enhancements

- Zod schema validation for JSON
- Build-time validation
- Auto-generate sitemap from JSON
- Auto-generate sidebar tree
- Add last-updated field per doc

---

# 13. Final Recommendation Architecture

TanStack Start

- Tailwind v4
- JSON content layer
- Typed validation (Zod)
- Reusable content renderer component

---

If you want next, I can:

- Design the **Content Renderer system (block renderer architecture)**
- Create a **typed Zod schema**
- Generate a **starter JSON structure for Askify docs**
- Or design a **scalable folder structure optimized for growth**
