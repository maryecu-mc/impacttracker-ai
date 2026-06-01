# Impact Tracker AI

An AI-powered tool to help job seekers track, refine, and quantify their professional accomplishments for resumes and interviews.

## Features

- **Impact Entry**: Log professional accomplishments with context
- **AI Refinement**: Automatically enhance entries with quantified, action-verb-led bullet points using Claude AI
- **Dashboard**: View and manage all tracked impacts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```
ANTHROPIC_API_KEY=your_api_key_here
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Claude AI (Anthropic SDK)
- localStorage for persistence
