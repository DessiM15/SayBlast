# SayBlast

Voice-powered email campaign builder. Speak to create campaigns, refine with conversation, and send through your own email account.

## Features

- **Voice Campaign Creation** — Speak into your mic and AI generates a complete email campaign with subject lines, HTML body, and plain text
- **Conversational Refinement** — Say "make it shorter" or "change the CTA" and the campaign updates in place
- **Rich Text Editor** — Full WYSIWYG editing with Tiptap, plus live HTML preview
- **Audience Management** — Create contact lists, add contacts manually or via CSV upload
- **Email Templates** — 5 built-in responsive templates plus custom template saving
- **Scheduled Sending** — Schedule campaigns for future delivery via cron
- **Anti-Spam Protection** — Hard 72-hour per-recipient cooldown, zero exceptions
- **Send Logging** — Track sent, skipped, and failed emails per campaign
- **Your Own Email** — Sends through Gmail (OAuth2), Outlook (OAuth2), or any SMTP server

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Auth**: Supabase Auth (Google, Microsoft, email/password)
- **Database**: Supabase PostgreSQL via Prisma ORM
- **AI**: Anthropic Claude API (claude-haiku-4-5)
- **Voice**: Web Speech API with text input fallback
- **Email**: Nodemailer (Gmail OAuth2, Outlook OAuth2, SMTP)
- **Cron**: Vercel Cron (production) + node-cron (local dev)
- **UI**: Tailwind CSS + shadcn/ui
- **Rich Text**: Tiptap WYSIWYG editor

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (Auth + PostgreSQL)
- Anthropic API key

### Install

```bash
git clone <repo-url>
cd sayblast
npm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below for details on each variable.

### Database Setup

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

Optionally seed the database:

```bash
npx tsx prisma/seed.ts
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Cron (for campaign sending)

In a separate terminal:

```bash
npx tsx scripts/cron-sender.ts
```

This checks for scheduled campaigns every minute and sends them.

## Project Structure

```
sayblast/
├── prisma/
│   ├── schema.prisma          # Database schema (7 models)
│   └── seed.ts                # Seed script
├── scripts/
│   └── cron-sender.ts         # Local dev cron job
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated app routes
│   │   │   ├── audiences/     # Audience management
│   │   │   ├── campaigns/     # Campaign list, detail, editor
│   │   │   ├── dashboard/     # Dashboard with stats
│   │   │   ├── settings/      # Email connection settings
│   │   │   └── templates/     # Template gallery
│   │   ├── (auth)/            # Login & registration
│   │   ├── api/               # API routes
│   │   │   ├── audiences/     # Audience CRUD
│   │   │   ├── campaigns/     # Campaign CRUD + send
│   │   │   ├── contacts/      # Contact management + CSV
│   │   │   ├── cron/          # Cron send endpoint
│   │   │   ├── templates/     # Template management
│   │   │   └── voice/         # AI processing + refinement
│   │   ├── error.tsx          # Error boundary
│   │   └── not-found.tsx      # 404 page
│   ├── components/            # UI components
│   ├── hooks/                 # Custom hooks (voice input)
│   └── lib/                   # Utilities
│       ├── auth/              # Session management
│       ├── email/             # Transport factory, sender, anti-spam
│       ├── supabase/          # Supabase client
│       └── templates/         # Built-in email templates
└── .env.example               # Environment variable reference
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for Gmail sending) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID (for Outlook sending) |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `ENCRYPTION_KEY` | 32-byte hex string for SMTP password encryption |
| `CRON_SECRET` | Secret token to protect the cron endpoint |
| `NEXT_PUBLIC_APP_URL` | App URL (default: `http://localhost:3000`) |

## Vercel Cron (Production)

Add a `vercel.json` to configure the cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/send",
      "schedule": "* * * * *"
    }
  ]
}
```

Set `CRON_SECRET` in your Vercel environment variables. Vercel automatically sends the authorization header.

## License

MIT
