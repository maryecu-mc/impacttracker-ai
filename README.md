# Impact Tracker AI

Capture accomplishments, contributions, and business impact. AI turns everyday work into language that lands in reviews, updates, and career conversations.

## Features

- **Capture Impact** — Log work in plain language with context and strategic alignment
- **AI Refinement** — Claude AI generates performance review bullets, STAR format, executive summaries, and more
- **Account-based saving** — Entries saved to Supabase per user with Row Level Security
- **Magic link sign-in** — Passwordless auth via Supabase Auth

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
ANTHROPIC_API_KEY=sk-ant-...
```

## Database Setup

Run `supabase-migration.sql` in the Supabase SQL Editor (Dashboard → SQL Editor → New query) to create the `impact_entries` table and enable Row Level Security.

## Tech Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase (Auth + Postgres with RLS)
- Anthropic Claude API

## Before Sharing Publicly

**Configure a custom SMTP provider before opening this app to the public.**

Supabase's built-in email sender has low rate limits (a few emails per hour across the entire project). Once multiple users are requesting magic links, those limits are hit quickly and sign-in fails with "email rate limit exceeded."

To fix: Supabase Dashboard → Authentication → SMTP Settings → enable custom SMTP and enter credentials from your email provider (e.g. Resend, SendGrid, Postmark, or your own SMTP server).
