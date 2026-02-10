# Contributing to Askify

Thank you for your interest in contributing to Askify! This guide will help you get started.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd askify-bot
   npm install
   ```

2. **Set up environment**

   ```bash
   cp .env.example .env
   # Fill in your Slack app credentials and database URL
   ```

3. **Set up the database**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   This runs with `nodemon` for automatic restarts on file changes.

## Project Structure

```
src/
  app.ts              # Entry point — registers handlers, starts app
  lib/prisma.ts       # Prisma client singleton (requires adapter)
  commands/           # /askify slash command + subcommands
  actions/            # Button/select action handlers
  views/              # Modal submission handlers
  events/             # Event handlers (DM messages, App Home tab)
  middleware/         # Global middleware (request logger)
  services/           # Business logic & database operations
  blocks/             # Block Kit message builders
  jobs/               # Background cron jobs
  utils/              # Pure utility functions
```

Each directory has an `index.ts` that exports a registration function (e.g., `registerActions(app)`). To add a new handler, create your file and wire it through the directory's `index.ts`.

## Key Conventions

### Code Style

- TypeScript strict mode is enabled
- Use `async/await` over raw promises
- Import Slack types (`KnownBlock`, `Button`, `View`) from `@slack/types`

### Action IDs

- Vote buttons: `vote_{optionId}` with value `{pollId}:{optionId}`
- Dynamic entity actions: `list_close_{pollId}`, `use_template_{id}`, etc.
- Static actions: `close_poll`, `add_option`, `save_as_template`, `share_results`
- Modal selects: `poll_type_select`, `close_method_select`, etc.

### Modal Callback IDs

- `poll_creation_modal`
- `save_template_modal`
- `add_option_modal`
- `share_results_modal`

### Database

- Prisma v7 with `@prisma/adapter-pg` driver adapter
- After schema changes: `npm run prisma:migrate` then `npm run prisma:generate`
- The generated client (`src/generated/prisma/`) is gitignored — always run `prisma:generate` after cloning
- All models use UUID primary keys

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) with emoji prefixes:

```
✨ feat: add new feature
🐛 fix: fix a bug
📝 docs: update documentation
♻️ refactor: refactor code
⚡️ perf: improve performance
🔧 chore: tooling/config changes
```

## Adding a New Feature

### New Action Handler

1. Create `src/actions/myAction.ts` with a `registerMyAction(app: App)` function
2. Add the registration call to `src/actions/index.ts`

### New Service

1. Create `src/services/myService.ts` with your business logic
2. Import and use it from action/view handlers

### New Cron Job

1. Create `src/jobs/myJob.ts` with a `startMyJob(client: WebClient)` function
2. Add the start call to `src/jobs/index.ts`

### New Event Handler

1. Create `src/events/myHandler.ts` with a `registerMyHandler(app: App)` function
2. Add the registration call to `src/events/index.ts`

### New Block Kit Builder

1. Create `src/blocks/myBlocks.ts` returning `{ blocks, text }` objects
2. Import and use from services or actions that post messages

## Type Checking

Run the TypeScript compiler without emitting to check for errors:

```bash
npx tsc --noEmit
```

## Database Migrations

```bash
npm run prisma:migrate    # Create & apply migrations (dev)
npx prisma migrate deploy # Apply migrations (production)
npm run prisma:studio     # Browse data in browser
```

## Reporting Issues

- Open an issue describing the bug or feature request
- Include steps to reproduce for bugs
- Include the expected vs actual behavior
