# Running this app fully outside Lovable

## What I found when I opened the export

This is **not** a plain Vite React SPA — it's a **TanStack Start** app (React 19 +
TanStack Router, SSR, server functions). The build tool is Vite + Nitro. That
matters because it means the app already runs as a normal Node/edge server;
nothing about *running* it depends on Lovable.

Three things actually tie it to Lovable, and I fixed two of them in the files
attached:

| # | What | Status |
|---|------|--------|
| 1 | Two Supabase clients existed: `src/integrations/supabase/*` (Lovable-managed project, dead code — nothing imports it except itself) and `src/integrations/backend/*` (the one the whole app actually uses). | Left the dead folder alone (harmless), confirmed nothing depends on it. All *your* work happens through `integrations/backend`. |
| 2 | `integrations/backend/config.ts` had your Supabase URL/key **hardcoded in the source file**, so pointing the app at a new database meant editing code. | **Fixed** — it now reads `VITE_BACKEND_URL` / `VITE_BACKEND_PUBLISHABLE_KEY` from `.env` first, and only falls back to the old hardcoded project if the env vars are missing. Swapping databases is now a `.env` edit, not a code edit. |
| 3 | `src/lib/ai.server.ts` had `embed()` (used to build the RAG knowledge base) **hard-wired to `ai.gateway.lovable.dev` with `LOVABLE_API_KEY`**, no fallback. Without a Lovable subscription, uploading knowledge-base documents would fail outright. | **Fixed** — `embed()` now calls Google's embeddings API directly using whatever Google key you save under **Admin → AI providers** in the app, and only falls back to the Lovable gateway if you never set one. |

Everything else (grading engine, examiner/audit prompts, calibration anchors,
diagrams, MCQs, OCR) was already provider-agnostic or already called Google
directly — the README in this repo (`README.md`) is itself an old build
instruction, not something Lovable enforces at runtime.

One thing I *didn't* rewire, since nothing in the app currently calls it:
`streamChat()` in `ai.server.ts` (reserved for a future streaming AI tutor)
still only talks to the Lovable gateway. If you build that feature later,
give me a shout and I'll wire it through the same provider-override path as
`embed()`.

---

## Step 1 — Create your new Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project. Pick a region
   close to your users, save the database password somewhere safe.
2. Once it's up, open **SQL Editor** and run
   `supabase/self-hosted/combined-fresh-install.sql` (in this export) top to
   bottom, once. It's everything from `supabase/migrations/*.sql` plus the
   old `self-hosted/setup.sql`, concatenated in order — it builds the whole
   schema (profiles, roles, subjects/units/topics, knowledge documents +
   pgvector chunks, essays, essay versions, calibration anchors, MCQs,
   diagrams, `ai_provider_keys`, usage logs, RLS policies, triggers) from
   nothing.
3. **Before running it**, open the file and find this line (near the top):
   ```sql
   select id, 'admin' from auth.users where email = 'vaquitavoid@gmail.com'
   ```
   This grants a permanent, un-removable admin role to that email. Change it
   to **the email you'll actually sign up with**, in both places it appears
   (the `insert` and the `protected_email constant` further down) — or just
   delete that whole block and grant yourself admin manually later via the
   `user_roles` table.
4. In **Project Settings → API**, copy:
   - **Project URL**
   - **Publishable key** (`sb_publishable_...`)
   - **Secret / service_role key** (`sb_secret_...`) — keep this one private.

## Step 2 — Point the app at it

Copy `.env.example` to `.env` and fill in the three values from Step 1:

```
VITE_BACKEND_URL="https://your-project-ref.supabase.co"
VITE_BACKEND_PUBLISHABLE_KEY="sb_publishable_..."
BACKEND_SERVICE_ROLE_KEY="sb_secret_..."
```

That's the entire database migration — no code changes needed.

## Step 3 — Install and run locally

```sh
npm install     # or: bun install
npm run dev
```

Sign up in the app with the email you used in Step 1's SQL edit — that
account becomes your permanent admin.

## Step 4 — Configure your AI provider (replaces the Lovable AI gateway)

Log in as admin → **Admin → AI providers**. Add a key for whichever model you
want to grade/tutor with (per your README, Gemini 2.5 Flash/Pro is the
intended default) and mark it active. This same screen is also where you
save a **Google** key — do this even if you pick a different provider for
grading, because it's what the RAG knowledge-base embedding step and the OCR
handwriting reader use directly. Recommended: Google AI Studio key (free
tier available) covers both.

You do **not** need `LOVABLE_API_KEY` at all with this set up. It only
exists in the code as a legacy fallback.

## Step 5 — Build and deploy

```sh
npm run build
```

This produces a Cloudflare Workers build by default (`.output/`,
`wrangler.json`) — that's a Nitro preset choice baked into
`@lovable.dev/vite-tanstack-config`, not a Lovable-account requirement. You
have two good options, no Lovable account involved either way:

**Option A — keep Cloudflare (fastest, generous free tier)**
```sh
npx wrangler login
npx nitro deploy --prebuilt
```
(or connect the repo in the Cloudflare dashboard for git-push deploys).

**Option B — switch to a plain Node server** (for Vercel/Render/Railway/your
own VPS), edit `vite.config.ts`:
```ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { preset: "node-server" },
});
```
then `npm run build` produces `.output/server/index.mjs` you run with
`node .output/server/index.mjs`, or point Vercel/Render at the repo — both
auto-detect Nitro output.

Either way, set the same three env vars from Step 2 (plus whichever provider
key if you choose to keep it in `LOVABLE_API_KEY`-style env rather than the
in-app Admin table) in your host's dashboard.

## Step 6 — Editing it going forward

It's a completely ordinary TanStack Start + Vite + Tailwind + shadcn/ui
codebase now:
- Routes: `src/routes/**` (file-based, TanStack Router)
- Server logic: `src/lib/**/*.server.ts` and `*.functions.ts`
- DB schema changes: add a new file under `supabase/migrations/`, run it in
  the Supabase SQL editor
- UI components: `src/components/**`

No Lovable CLI, no Lovable build step, no Lovable dependency to keep this
running — `@lovable.dev/vite-tanstack-config` (a devDependency) is just a
public npm config-generator package; it works with no Lovable account, but
if you'd rather not depend on it long-term I can swap `vite.config.ts` for a
plain `@tanstack/react-start` + `nitro/vite` + `@tailwindcss/vite` config
with the same behavior — just ask.

## What I could not verify from the export

- Whether you have other data already sitting in the *old* project
  (`ccxphyddlztzhcvyuvuc.supabase.co`, referenced as the fallback in
  `config.ts`) that you want migrated into the new one, versus starting
  clean. If you want that data carried over, tell me and I'll write a
  `pg_dump`/`pg_restore` (or CSV export/import) procedure for the specific
  tables that matter to you.
