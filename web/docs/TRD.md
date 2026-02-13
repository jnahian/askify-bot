Below is your **Technical Specification + Design System**  
for the Askify Website (TanStack Start + JSON Content Architecture).

---

# Askify Website

## Technical Specification & Design System

**Framework:** TanStack Start  
**Language:** TypeScript  
**Content:** JSON-driven  
**Styling:** Tailwind CSS v4  
**Architecture Type:** Static-first, SSR-capable

---

# 1. System Architecture

## 1.1 High-Level Architecture

```
Client
  ↓
TanStack Router
  ↓
Route Loader
  ↓
Content Layer (JSON + Zod Validation)
  ↓
Typed Content Model
  ↓
UI Components
```

---

## 1.2 Project Structure

```
src/
  routes/
    index.tsx
    docs/
      route.tsx
      $id.tsx
    changelog/
      route.tsx
      $version.tsx
    terms.tsx
    privacy.tsx

  components/
    layout/
      Navbar.tsx
      Footer.tsx
      Container.tsx
    docs/
      Sidebar.tsx
      DocRenderer.tsx
      CodeBlock.tsx
    changelog/
      ChangelogItem.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Alert.tsx

  lib/
    content/
      docs.ts
      changelog.ts
      schemas.ts
    seo.ts
    utils.ts

content/
  docs/
    getting-started.json
    commands.json
  changelog/
    v1.2.0.json
```

---

# 2. Routing Architecture (TanStack Router)

## Landing

```
/
```

## Docs

```
/docs
/docs/:id
```

## Changelog

```
/changelog
/changelog/:version
```

## Legal

```
/terms
/privacy
```

Each dynamic route:

- Loads JSON via loader
- Validates with Zod
- Injects SEO meta
- Renders via structured renderer

---

# 3. Content Layer Architecture

---

## 3.1 JSON Strategy

Split per document file:

```
content/docs/getting-started.json
content/docs/commands.json
```

Avoid one large JSON file.

---

## 3.2 Zod Validation Layer

### schemas.ts

```ts
import { z } from 'zod'

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('code'),
    language: z.string(),
    value: z.string(),
  }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string()),
  }),
  z.object({
    type: z.literal('note'),
    text: z.string(),
  }),
])

export const DocSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  order: z.number(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.array(ContentBlockSchema),
    }),
  ),
})
```

---

## 3.3 Content Loader

Responsibilities:

- Load JSON
- Validate with Zod
- Sort by order
- Group by category
- Cache in memory

---

# 4. Content Renderer System

## 4.1 DocRenderer Component

Block-driven architecture:

```tsx
switch (block.type) {
  case 'paragraph':
  case 'code':
  case 'list':
  case 'note':
}
```

Renderer must be:

- Extensible
- Accessible
- Theme-aware

---

## 4.2 CodeBlock System

Requirements:

- Syntax highlighting (Shiki or Prism)
- Copy button
- Dark mode aware

---

# 5. Design System Specification

---

# 5.1 Design Philosophy

- Clean SaaS
- Slack-compatible aesthetic
- Modern minimal UI
- High readability
- Light + Dark support

---

# 5.2 Design Tokens

---

## 5.2.1 Brand Colors

Primary Gradient:

```
Teal:  #0F9EA8
Green: #39C26A
```

---

### Base Tokens

```css
:root {
  --brand: #0f9ea8;
  --accent: #39c26a;

  --bg: #ffffff;
  --bg-muted: #f7f9fc;
  --bg-dark: #0b1118;

  --text-primary: #0b1118;
  --text-secondary: #3b4b5d;
  --text-inverse: #ffffff;

  --border: #e5e7eb;

  --success: #39c26a;
  --warning: #f59e0b;
  --danger: #ef4444;

  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

---

## 5.2.2 Dark Mode Tokens

```css
.dark {
  --bg: #0b1118;
  --bg-muted: #16212c;

  --text-primary: #ffffff;
  --text-secondary: #b9c6d8;

  --border: rgba(255, 255, 255, 0.12);
}
```

---

# 5.3 Typography

## Font

System Sans or Inter.

## Scale

| Token    | Size |
| -------- | ---- |
| text-xs  | 12px |
| text-sm  | 14px |
| text-md  | 16px |
| text-lg  | 18px |
| text-xl  | 20px |
| text-2xl | 24px |
| text-3xl | 30px |
| text-4xl | 36px |

---

# 5.4 Spacing System

8px Grid

```
4px  = 0.25rem
8px  = 0.5rem
16px = 1rem
24px = 1.5rem
32px = 2rem
48px = 3rem
64px = 4rem
```

---

# 5.5 Component Specifications

---

## 5.5.1 Button

### Variants

- Primary (gradient)
- Secondary
- Ghost

### Requirements

- Focus ring
- Hover state
- Disabled state
- Accessible contrast

---

## 5.5.2 Card

- Rounded large radius
- Subtle shadow
- Border in light mode
- Slight elevation in dark mode

---

## 5.5.3 Sidebar (Docs)

- Fixed width
- Scrollable
- Active item indicator
- Collapsible category support (future)

---

## 5.5.4 Badge

Used for:

- Version
- Feature type
- Status

Variants:

- feature
- fix
- improvement

---

# 6. SEO System

---

## 6.1 Meta Generation

Dynamic per route:

```ts
title: doc.title
description: doc.description
canonical: /docs/:id
```

---

## 6.2 Sitemap Generation

Auto-generate from:

- Docs JSON
- Changelog JSON
- Static routes

---

# 7. Accessibility Standards

- Semantic HTML
- Proper heading hierarchy
- Keyboard navigation
- Focus indicators
- ARIA labels where required
- Code block copy button accessible

---

# 8. Performance Requirements

- No unnecessary hydration
- Lazy load heavy components
- Code splitting per route
- Static JSON import
- Lighthouse 90+

---

# 9. Security Considerations

- No dynamic HTML injection
- No raw HTML rendering from JSON
- Strict block types
- CSP-ready structure

---

# 10. Extensibility Strategy

Future-ready for:

- Versioned docs
- Search index
- CMS migration
- API-based content
- Blog addition
- Feature roadmap page

---

# 11. Development Standards

- Strict TypeScript
- Zod validation
- No any types
- Reusable UI primitives
- Consistent naming
- ESLint + Prettier
- Clear folder separation

---

# 12. MVP Completion Criteria

- All 5 pages live
- JSON content validated
- SEO meta implemented
- Dark mode works
- Lighthouse 90+
- Fully responsive

---

If you'd like next, I can:

- Generate full **component API contracts**
- Create a **content renderer implementation example**
- Design a **search architecture**
- Or generate a **complete starter boilerplate folder with example files**
