# Kaam — task board

Kaam (Hindi for "work") is a calm, focused kanban board for keeping track of what needs doing. Add tasks with notes, a priority and a due date, then drag them from **To do** to **In progress** to **Done**. Search and priority filters help you find things quickly, overdue tasks are flagged, and a progress bar shows how much of the board is finished.

## Tech

- [TanStack Start](https://tanstack.com/start) (React 19, TanStack Router, Vite)
- Tailwind CSS 4 and shadcn/ui components
- [Netlify Database](https://docs.netlify.com) (managed Postgres) with Drizzle ORM
- Deployed on Netlify

## Running locally

```bash
pnpm install
netlify dev
```

`netlify dev` serves the app and emulates Netlify Database locally. The schema lives in `db/schema.ts`; after changing it, generate a migration with:

```bash
npx drizzle-kit generate --name describe_the_change
```

Migrations in `netlify/database/migrations/` are applied automatically when the site deploys.

## Ideas for later

- Sign-in with Netlify Identity so each person gets a private board
- Multiple boards or projects
- Labels, sub-task checklists and assignees
