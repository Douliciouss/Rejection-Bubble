# Reject Bubbles

A web-based rejection journal with bubble visualization and insight engine. Log rejections and interview attempts, capture structured context (stage, timing, notes), and see data-driven summaries. The dashboard is an interactive bubble field where each bubble is a company, sized by rejection count.

## MVP Features

- **Auth**: Sign in / sign up (Supabase Auth)
- **Bubble dashboard**: Companies as bubbles; size = rejection count; drag, hover tooltip, click opens drawer
- **Top 5 panel**: Left panel lists top companies by rejections; hover highlights the bubble
- **Company drawer**: Click a bubble to open a right-side drawer with timeline of events and “Add log”
- **Quick Log**: Log a rejection in ≤60s (company, stage, date, optional note)
- **Add company**: Create a company (name, optional careers URL, optional logo URL)
- **Stats**: Total companies, total rejections, rejections in last 30 days
- **Privacy**: Row-level security; all data per-user

## AI Analysis (OpenRouter)

Analysis is **on-demand** (user clicks “Refresh analysis”):

- **Company-level**: In the company drawer, get themes/bottlenecks, likely failure reasons, and a targeted action plan for that company.
- **Dashboard-level**: Overview card shows recurring patterns, most common bottleneck stages, and top 1–3 focus areas across all logs.
- **Weekly review**: Summary of the last 7 days, what improved or got worse, and 3 concrete tasks for next week.

Outputs are evidence-based (tied to your notes), explicitly note missing data when logs are thin, and are actionable. Implemented via Next.js Server Actions calling OpenRouter; only structured analysis JSON is stored, not full prompts/responses. Minimal logging: request id, timestamp, model, latency, success, token counts.

## Setup

1. **Clone and install**

   ```bash
   cd "Reject Bubbles"
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run the contents of `supabase/migrations/001_schema.sql`, then `002_ai_analyses.sql`.
   - In Project Settings → API, copy the project URL and anon key.
   - **Email confirmation (optional):** By default Supabase requires users to confirm their email before signing in. To allow sign-in right after signup (e.g. for development), go to **Authentication → Providers → Email** and turn off **“Confirm email”**.

3. **Env**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **AI analysis (optional):** `OPENROUTER_API_KEY` from [OpenRouter](https://openrouter.ai). Optionally set `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`).

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, add a company, open it from the bubble (or Top 5), then use “Add log” to record a rejection.

## Data model (MVP)

- **companies**: `id`, `user_id`, `name`, `logo_url`, `company_url`, `created_at`
- **events**: `id`, `user_id`, `company_id`, `type` (reject | interview | …), `stage` (OA | Phone | Onsite | …), `happened_at`, `rejected_at`, `note`, `created_at`
- **tags** / **event_tags**: for future tag-based analytics

The dashboard reads from the `bubble_companies` view (companies + rejection count).

## Roadmap

- **V1**: Tag analytics, stage bottlenecks, CSV/Notion export, bubble grouping by stage/role
- **V2**: AI tag extraction and improvement plan (opt-in), template library
