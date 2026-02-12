# Askify Website — Implementation Plan

> Based on PRD.md, TRD.md, and CONTENT-MAP.md
> Framework: TanStack Start + TypeScript + Tailwind v4
> Date: 2026-02-12

---

## Project Overview

**Goal:** Build a fast, SEO-friendly, JSON-driven website for Askify

**Pages:** 5 (Landing, Docs, Changelog, Terms, Privacy)

**Timeline:** 3 sprints (~1 week)

---

## Sprint Breakdown

### Sprint 1: Foundation + Landing Page (Days 1-3)
- Phase 0: Project setup
- Phase 5: UI component library
- Phase 1: Landing page

### Sprint 2: Content Pages (Days 4-6)
- Phase 2: Documentation system
- Phase 3: Changelog system

### Sprint 3: Polish (Days 7-8)
- Phase 4: Legal pages
- SEO optimization
- Performance audit
- Deployment preparation

---

## Phase 0: Project Setup & Infrastructure

### 0.1 Initialize TanStack Start Project

**Tasks:**
- [ ] Create new TanStack Start project in `/web` directory
- [ ] Configure TypeScript (strict mode)
- [ ] Set up Tailwind CSS v4
- [ ] Configure build tools

**Commands:**
```bash
cd web
npm create @tanstack/start@latest
npm install
```

**Files Created:**
```
web/
  package.json
  tsconfig.json
  tailwind.config.ts
  app.config.ts (TanStack Start config)
```

---

### 0.2 Create Project Structure

**Tasks:**
- [ ] Create folder structure per TRD section 1.2
- [ ] Set up path aliases in tsconfig

**Folder Structure:**
```
web/
  src/
    routes/           # TanStack Router routes
      index.tsx       # Landing page
      docs/
        route.tsx     # Docs layout
        $id.tsx       # Dynamic doc page
      changelog/
        route.tsx     # Changelog index
        $version.tsx  # Dynamic changelog page
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
      landing/
        Hero.tsx
        FeaturesGrid.tsx
        HowItWorks.tsx
        UseCases.tsx
        Screenshots.tsx
        CTASection.tsx
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        Alert.tsx

    lib/
      content/
        docs.ts         # Doc loader utilities
        changelog.ts    # Changelog loader utilities
        schemas.ts      # Zod validation schemas
      seo.ts            # SEO meta generator
      utils.ts          # Shared utilities

  content/
    docs/
      getting-started.json
      poll-types.json
      commands.json
      voting-results.json
      scheduling.json
      templates.json
      advanced-settings.json
      architecture.json
    changelog/
      v1.1.0.json
      v1.0.1.json
      v1.0.0.json

  public/
    assets/
      logo.svg
      screenshots/
```

---

### 0.3 Design System Setup

**Tasks:**
- [ ] Create Tailwind config with design tokens (TRD section 5.2)
- [ ] Add CSS custom properties for colors, spacing, typography
- [ ] Configure dark mode strategy (class-based)
- [ ] Set up font stack (Inter or system fonts)

**Files:**
```
src/styles/
  globals.css       # CSS variables + Tailwind directives
```

**CSS Variables (from TRD):**
```css
:root {
  --brand: #0f9ea8;
  --accent: #39c26a;

  --bg: #ffffff;
  --bg-muted: #f7f9fc;
  --text-primary: #0b1118;
  --text-secondary: #3b4b5d;

  --border: #e5e7eb;

  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.dark {
  --bg: #0b1118;
  --bg-muted: #16212c;
  --text-primary: #ffffff;
  --text-secondary: #b9c6d8;
  --border: rgba(255, 255, 255, 0.12);
}
```

---

### 0.4 Zod Schemas

**File:** `src/lib/content/schemas.ts`

**Tasks:**
- [ ] Create `ContentBlockSchema` (discriminated union)
- [ ] Create `DocSchema`
- [ ] Create `ChangelogSchema`
- [ ] Export TypeScript types from schemas

**Blocks:**
```typescript
ContentBlockSchema = z.discriminatedUnion('type', [
  paragraph,
  code,
  list,
  note,
  warning,
])
```

---

### 0.5 Content Loader Utilities

**File:** `src/lib/content/docs.ts`

**Functions:**
- [ ] `getAllDocs()` — Load all docs, validate with Zod
- [ ] `getDocById(id)` — Get single doc
- [ ] `getDocsByCategory()` — Group docs by category
- [ ] `sortDocsByOrder()` — Sort by order field

**File:** `src/lib/content/changelog.ts`

**Functions:**
- [ ] `getAllChangelogs()` — Load all changelog entries
- [ ] `getChangelogByVersion(version)` — Get single entry
- [ ] `sortChangelogsByDate()` — Reverse chronological

---

### 0.6 Base Layout Components

**Component:** `src/components/layout/Navbar.tsx`

**Features:**
- [ ] Logo (left)
- [ ] Links: Docs, Changelog, GitHub
- [ ] CTA: "Add to Slack" button (right)
- [ ] Mobile menu (hamburger)
- [ ] Dark mode toggle

**Component:** `src/components/layout/Footer.tsx`

**Features:**
- [ ] Four columns: Product, Legal, Social, Copyright
- [ ] Links styled consistently
- [ ] Responsive grid

**Component:** `src/components/layout/Container.tsx`

**Features:**
- [ ] Max width wrapper (1280px)
- [ ] Responsive padding
- [ ] Reusable across all pages

---

### 0.7 SEO Utilities

**File:** `src/lib/seo.ts`

**Functions:**
- [ ] `generateMeta({ title, description, canonical, ogImage })` — Generate meta tags
- [ ] `generateSitemap()` — Auto-generate sitemap.xml from content

---

## Phase 1: Landing Page (`/`)

**Route:** `src/routes/index.tsx`

### 1.1 Hero Section

**Component:** `src/components/landing/Hero.tsx`

**Content:**
- Headline: "Powerful Slack Polls Made Simple"
- Subheadline: "Team decisions, engagement, and feedback — all without leaving Slack"
- Primary CTA: "Add to Slack"
- Secondary CTA: "View Documentation"

**Design:**
- [ ] Gradient background (teal → green)
- [ ] Large headline (text-4xl lg:text-5xl)
- [ ] Button with gradient background
- [ ] Responsive layout (flex-col on mobile, flex-row on desktop)

---

### 1.2 Features Grid

**Component:** `src/components/landing/FeaturesGrid.tsx`

**Content:** 6 features from CONTENT-MAP.md

**Design:**
- [ ] Grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- [ ] Card component with icon, title, description
- [ ] Hover state with subtle lift

---

### 1.3 How It Works

**Component:** `src/components/landing/HowItWorks.tsx`

**Content:** 3 steps (Create, Vote, Share)

**Design:**
- [ ] Horizontal timeline on desktop, vertical on mobile
- [ ] Step numbers with gradient circles
- [ ] Icon + title + description per step

---

### 1.4 Use Cases

**Component:** `src/components/landing/UseCases.tsx`

**Content:** 4 use cases from CONTENT-MAP.md

**Design:**
- [ ] Grid layout (2x2)
- [ ] Card with emoji icon, title, description, example question

---

### 1.5 Screenshots

**Component:** `src/components/landing/Screenshots.tsx`

**Content:**
- Poll creation modal screenshot
- Active poll screenshot
- Results screenshot

**Design:**
- [ ] Carousel or grid
- [ ] Shadow + border for screenshot images
- [ ] Captions below each screenshot

**Assets Needed:**
- [ ] Take screenshots from running Askify bot
- [ ] Save to `public/assets/screenshots/`

---

### 1.6 Final CTA

**Component:** `src/components/landing/CTASection.tsx`

**Content:**
- Headline: "Ready to transform team decisions?"
- CTA: "Add to Slack — Free to Use"
- Note: "Works with Slack's free and paid plans"

**Design:**
- [ ] Full-width section with gradient background
- [ ] Centered content
- [ ] Large button

---

### 1.7 Landing Page Meta

**SEO:**
- Title: "Askify — Powerful Slack Polls Made Simple"
- Description: "Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results. Free internal tool."
- Open Graph image: Create OG image (1200x630)

---

## Phase 2: Documentation System

### 2.1 Create Doc JSON Files

**Tasks:**
- [ ] Create 8 JSON files from CONTENT-MAP.md
- [ ] Validate with Zod schemas
- [ ] Test loading with `getAllDocs()`

**Files:**
```
content/docs/
  getting-started.json
  poll-types.json
  commands.json
  voting-results.json
  scheduling.json
  templates.json
  advanced-settings.json
  architecture.json
```

**Sample Structure:**
```json
{
  "id": "getting-started",
  "title": "Getting Started",
  "description": "Install and configure Askify in your Slack workspace",
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
          "value": "/askify"
        }
      ]
    }
  ]
}
```

---

### 2.2 Sidebar Component

**Component:** `src/components/docs/Sidebar.tsx`

**Features:**
- [ ] Auto-generated from `getAllDocs()`
- [ ] Grouped by category
- [ ] Sorted by order
- [ ] Active state highlighting
- [ ] Collapsible on mobile

**Design:**
- [ ] Fixed width (280px) on desktop
- [ ] Full-height with scroll
- [ ] Border-right
- [ ] Active item: gradient text + background

---

### 2.3 Doc Renderer

**Component:** `src/components/docs/DocRenderer.tsx`

**Features:**
- [ ] Render content blocks by type
- [ ] Switch statement for block types
- [ ] Accessible heading hierarchy
- [ ] Anchor links for sections

**Block Renderers:**
- `paragraph` → `<p className="...">{text}</p>`
- `code` → `<CodeBlock language={...} value={...} />`
- `list` → `<ul><li>...</li></ul>`
- `note` → `<Alert variant="info">{text}</Alert>`
- `warning` → `<Alert variant="warning">{text}</Alert>`

---

### 2.4 Code Block Component

**Component:** `src/components/docs/CodeBlock.tsx`

**Features:**
- [ ] Syntax highlighting (use Shiki)
- [ ] Copy button (top-right)
- [ ] Language label (top-left)
- [ ] Dark mode aware
- [ ] Line numbers (optional)

**Dependencies:**
```bash
npm install shiki
```

**Design:**
- [ ] Rounded corners
- [ ] Background color (dark in light mode, darker in dark mode)
- [ ] Copy button with success state

---

### 2.5 Docs Routes

**Route:** `src/routes/docs/route.tsx`

**Features:**
- [ ] Layout with Sidebar + main content area
- [ ] Redirect `/docs` to `/docs/getting-started`

**Route:** `src/routes/docs/$id.tsx`

**Features:**
- [ ] Load doc by ID from loader
- [ ] Render with DocRenderer
- [ ] SEO meta injection
- [ ] 404 if doc not found

**Loader:**
```typescript
export const loader = async ({ params }) => {
  const doc = await getDocById(params.id)
  if (!doc) throw new Response('Not Found', { status: 404 })
  return { doc }
}
```

---

### 2.6 Docs SEO

**Meta:**
- Title: `{doc.title} — Askify Docs`
- Description: `{doc.description}`
- Canonical: `/docs/{id}`

---

## Phase 3: Changelog System

### 3.1 Create Changelog JSON Files

**Tasks:**
- [ ] Create 3 changelog JSON files from CONTENT-MAP.md
- [ ] Validate with Zod schemas
- [ ] Test loading

**Files:**
```
content/changelog/
  v1.1.0.json
  v1.0.1.json
  v1.0.0.json
```

**Sample Structure:**
```json
{
  "version": "1.1.0",
  "date": "2026-02-12",
  "type": "feature",
  "title": "UI Improvements & List Enhancements",
  "items": [
    {
      "type": "feature",
      "text": "Poll Description Field — Optional multiline description"
    },
    {
      "type": "improvement",
      "text": "Enhanced Poll List — Shows all statuses"
    }
  ]
}
```

---

### 3.2 Changelog Item Component

**Component:** `src/components/changelog/ChangelogItem.tsx`

**Features:**
- [ ] Version badge
- [ ] Date (formatted)
- [ ] Title
- [ ] Item list with type badges
- [ ] Latest version highlight

**Design:**
- [ ] Card layout
- [ ] Badge colors: feature (green), improvement (blue), fix (orange)
- [ ] Date in secondary text color

---

### 3.3 Changelog Routes

**Route:** `src/routes/changelog/route.tsx`

**Features:**
- [ ] Load all changelog entries
- [ ] Sort reverse chronological
- [ ] Render with ChangelogItem
- [ ] Highlight latest version

**Route:** `src/routes/changelog/$version.tsx`

**Features:**
- [ ] Load changelog by version
- [ ] Full-page detail view
- [ ] SEO meta
- [ ] 404 if version not found

---

### 3.4 Changelog SEO

**Meta:**
- Title: `Askify v{version} — Changelog`
- Description: Auto-generate from first 2-3 items
- Canonical: `/changelog/{version}`

---

## Phase 4: Legal Pages

### 4.1 Terms of Service

**Route:** `src/routes/terms.tsx`

**Content:**
- [ ] Static JSX with structured sections
- [ ] Last updated date at top
- [ ] Table of contents with anchor links
- [ ] 8 sections (from CONTENT-MAP.md)

**Design:**
- [ ] Container with max-width
- [ ] Typography hierarchy (h1, h2, p)
- [ ] Print-friendly styling

---

### 4.2 Privacy Policy

**Route:** `src/routes/privacy.tsx`

**Content:**
- [ ] Static JSX with structured sections
- [ ] Last updated date
- [ ] Table of contents
- [ ] 6 sections (from CONTENT-MAP.md)

**Design:**
- [ ] Same as Terms of Service
- [ ] Accessible heading hierarchy

---

## Phase 5: UI Component Library

### 5.1 Button Component

**Component:** `src/components/ui/Button.tsx`

**Variants:**
- `primary` — Gradient background (teal → green)
- `secondary` — Border with transparent bg
- `ghost` — No border, transparent bg

**Props:**
- `variant`
- `size` (sm, md, lg)
- `disabled`
- `children`
- `onClick`
- `href` (optional, renders as link)

**Design:**
- [ ] Focus ring (visible)
- [ ] Hover state (darken/lighten)
- [ ] Disabled state (opacity 50%, cursor not-allowed)

---

### 5.2 Card Component

**Component:** `src/components/ui/Card.tsx`

**Features:**
- [ ] Rounded large radius (16px)
- [ ] Shadow (subtle)
- [ ] Border in light mode
- [ ] Slight elevation in dark mode
- [ ] Hover lift (optional prop)

**Props:**
- `children`
- `className` (for extending)
- `hover` (boolean)

---

### 5.3 Badge Component

**Component:** `src/components/ui/Badge.tsx`

**Variants:**
- `feature` — Green
- `fix` — Orange
- `improvement` — Blue
- `version` — Gray

**Props:**
- `variant`
- `children`

**Design:**
- [ ] Small text (text-xs)
- [ ] Padding (px-2 py-1)
- [ ] Rounded (rounded-md)
- [ ] Uppercase

---

### 5.4 Alert Component

**Component:** `src/components/ui/Alert.tsx`

**Variants:**
- `info` — Blue background
- `warning` — Orange background
- `success` — Green background

**Props:**
- `variant`
- `children`

**Design:**
- [ ] Icon on left (based on variant)
- [ ] Colored border-left
- [ ] Colored background (muted)

---

## Phase 6: Final Polish

### 6.1 SEO Optimization

**Tasks:**
- [ ] Generate sitemap.xml from content
- [ ] Add robots.txt
- [ ] Open Graph images for all pages
- [ ] Twitter Card meta tags
- [ ] Canonical URLs
- [ ] JSON-LD structured data (optional)

---

### 6.2 Performance Optimization

**Tasks:**
- [ ] Code splitting per route
- [ ] Lazy load screenshots
- [ ] Optimize images (WebP + fallback)
- [ ] Minimize bundle size
- [ ] Run Lighthouse audit (target 90+)

---

### 6.3 Accessibility

**Tasks:**
- [ ] Keyboard navigation testing
- [ ] Focus indicators on all interactive elements
- [ ] ARIA labels where needed
- [ ] Semantic HTML throughout
- [ ] Color contrast check (WCAG AA)
- [ ] Screen reader testing

---

### 6.4 Dark Mode Testing

**Tasks:**
- [ ] Test all pages in dark mode
- [ ] Ensure all colors have dark mode variants
- [ ] Test color contrast in dark mode
- [ ] Persist dark mode preference (localStorage)

---

### 6.5 Responsive Testing

**Tasks:**
- [ ] Test all pages on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px, 1920px)
- [ ] Fix layout issues

---

## Phase 7: Deployment

### 7.1 Build & Deploy

**Tasks:**
- [ ] Configure production build
- [ ] Set up hosting (Vercel, Netlify, or Cloudflare Pages)
- [ ] Configure custom domain
- [ ] Set up SSL
- [ ] Test production build

**Build Command:**
```bash
npm run build
```

---

### 7.2 Analytics (Optional)

**Tasks:**
- [ ] Add analytics (Plausible or Simple Analytics)
- [ ] Track page views
- [ ] Privacy-friendly (no cookies)

---

## Completion Checklist

### Phase 0: Foundation
- [ ] TanStack Start initialized
- [ ] TypeScript configured
- [ ] Tailwind v4 set up
- [ ] Design tokens defined
- [ ] Folder structure created
- [ ] Zod schemas written
- [ ] Content loaders implemented
- [ ] Base layout components built

### Phase 1: Landing Page
- [ ] Hero section
- [ ] Features grid
- [ ] How it works
- [ ] Use cases
- [ ] Screenshots
- [ ] Final CTA
- [ ] SEO meta

### Phase 2: Documentation
- [ ] 8 doc JSON files created
- [ ] Sidebar component
- [ ] DocRenderer component
- [ ] CodeBlock component
- [ ] Docs routes
- [ ] SEO meta

### Phase 3: Changelog
- [ ] 3 changelog JSON files
- [ ] ChangelogItem component
- [ ] Changelog routes
- [ ] SEO meta

### Phase 4: Legal
- [ ] Terms of Service page
- [ ] Privacy Policy page

### Phase 5: UI Components
- [ ] Button
- [ ] Card
- [ ] Badge
- [ ] Alert

### Phase 6: Polish
- [ ] SEO optimization
- [ ] Performance audit
- [ ] Accessibility testing
- [ ] Dark mode testing
- [ ] Responsive testing

### Phase 7: Deployment
- [ ] Production build
- [ ] Hosted and live
- [ ] Custom domain configured

---

## Success Criteria

- ✅ All 5 pages live and functional
- ✅ Content validated with Zod
- ✅ SEO meta on all pages
- ✅ Dark mode works across all pages
- ✅ Lighthouse score 90+ (Performance, Accessibility, Best Practices, SEO)
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ No hydration errors
- ✅ Fast page loads (<2s)

---

## Next Steps

**Option 1:** Start with Phase 0 (Project Setup)
**Option 2:** Review and approve this plan first
**Option 3:** Ask questions or request modifications

Ready to begin implementation?
