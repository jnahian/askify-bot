# Askify Website

> Marketing website and documentation for Askify Slack bot
> Built with TanStack Start + TypeScript + Tailwind CSS v4

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Framework:** TanStack Start (React + Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Content:** JSON-driven with Zod validation
- **Code Highlighting:** Shiki
- **Icons:** Lucide React

## Project Structure

```
src/
  components/
    layout/       - Navbar, Footer, Container
    ui/           - Button, Card, Badge, Alert
    docs/         - Documentation renderer
    changelog/    - Changelog components
    landing/      - Landing page sections

  lib/
    content/      - JSON loaders + Zod schemas
    utils.ts      - Utility functions
    seo.ts        - SEO meta generators

  routes/
    index.tsx     - Landing page
    docs/         - Documentation routes
    changelog/    - Changelog routes
    terms.tsx     - Terms of Service
    privacy.tsx   - Privacy Policy

content/
  docs/           - Documentation JSON files
  changelog/      - Changelog JSON files

public/
  assets/         - Images, screenshots, OG images
```

## Development

### Adding Documentation

1. Create a new JSON file in `content/docs/`:

```json
{
  "id": "new-doc",
  "title": "New Documentation Page",
  "description": "Brief description for SEO",
  "category": "Introduction",
  "order": 1,
  "sections": [
    {
      "heading": "Getting Started",
      "content": [
        {
          "type": "paragraph",
          "text": "Your content here..."
        }
      ]
    }
  ]
}
```

2. The file will be automatically loaded and validated

### Adding Changelog

1. Create a new JSON file in `content/changelog/`:

```json
{
  "version": "1.2.0",
  "date": "2026-02-12",
  "type": "feature",
  "title": "New Features",
  "items": [
    {
      "type": "feature",
      "text": "Feature description"
    }
  ]
}
```

### Content Block Types

- `paragraph` - Text paragraph
- `code` - Code block with syntax highlighting
- `list` - Bulleted or numbered list
- `note` - Info callout
- `warning` - Warning callout
- `heading` - Section heading

## Design System

### Colors

```css
--brand: #0f9ea8     /* Teal */
--accent: #39c26a    /* Green */
```

### Components

- **Button:** 3 variants (primary, secondary, ghost), 3 sizes
- **Card:** With header, title, description, content, footer
- **Badge:** Color-coded type badges
- **Alert:** Info, warning, success, error variants

### Utilities

- `cn()` - Merge Tailwind classes
- `formatDate()` - Format dates
- `slugify()` - Create URL slugs

## Deployment

### Build

```bash
npm run build
```

### Environment Variables

Create `.env` (if needed):

```env
VITE_SITE_URL=https://askify.app
VITE_SLACK_CLIENT_ID=your_client_id
```

### Hosting Options

- **Vercel:** Connect GitHub repo (recommended)
- **Netlify:** Drag & drop or GitHub
- **Cloudflare Pages:** GitHub integration

## Scripts

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
npm run check    # Format + lint fix
```

## Current Status

- ✅ **Phase 0:** Foundation complete
- 🚧 **Phase 1:** Landing page (in progress)
- ⏳ **Phase 2:** Documentation system
- ⏳ **Phase 3:** Changelog system
- ⏳ **Phase 4:** Legal pages

## Documentation

- [PRD](./docs/PRD.md) - Product Requirements
- [TRD](./docs/TRD.md) - Technical Requirements
- [CONTENT-MAP](./docs/CONTENT-MAP.md) - Content structure
- [IMPLEMENTATION-PLAN](./docs/IMPLEMENTATION-PLAN.md) - Full roadmap
- [PHASE-0-COMPLETE](./docs/PHASE-0-COMPLETE.md) - Phase 0 summary

## Links

- [Main Project](../) - Askify Slack bot
- [TanStack Start Docs](https://tanstack.com/start)
- [Tailwind CSS v4](https://tailwindcss.com/)
