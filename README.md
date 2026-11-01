# minervasharp-personal-site

Personal portfolio for [minervasharp.com](https://minervasharp.com): a single-page
React site themed as low-poly, liminal cityscapes that shift from dusk to night as
you scroll. All scenery is hand-drawn SVG (no raster assets). A small Cloudflare
Worker handles a Turnstile-protected contact form.

## Stack

- Vite + React + TypeScript, built with `@cloudflare/vite-plugin` (client assets + Worker build together).
- Plain CSS, self-hosted fonts (Sora, JetBrains Mono). No UI framework, no WebGL.
- Cloudflare Workers Static Assets for the site; Worker only runs for `/api/*`.
- Cloudflare Turnstile (bot check) + Email Service `send_email` binding for the contact form.

Everything stays inside the Cloudflare Workers Free plan: static assets are free,
and email to a verified destination address is free on all plans.

## Commands

```bash
npm install
npm run dev     # local dev (Vite + workerd via the Cloudflare plugin)
npm run build   # tsc + vite build -> dist/
npm run preview # preview the built app
npm run deploy  # build, then wrangler deploy
npm run types   # regenerate worker-configuration.d.ts after wrangler.jsonc changes
```

## Project layout

- `src/` React app: `scenes/` (five SVG cityscapes), `primitives/` (buildings, lights, signs, traffic signal, etc.), `components/`, `hooks/`, `lib/` (seeded PRNG + time-of-day palettes), `content/resume.ts` (all copy).
- `worker/index.ts` the `/api/contact` handler (validation, honeypot, Turnstile siteverify, email send).
- `wrangler.jsonc` Worker config (custom domains, `send_email` binding, vars). The Vite plugin injects `assets.directory` at build time, so it is not set here.

## Environment / secrets

| Name | Where | Purpose |
| --- | --- | --- |
| `VITE_TURNSTILE_SITEKEY` | build-time env (client) | Turnstile sitekey. Falls back to the public test sitekey if unset. |
| `TURNSTILE_SECRET` | Worker secret | Turnstile secret for server-side siteverify. |

Local dev uses Cloudflare's "always passes" Turnstile test keys: the client falls
back to the test sitekey automatically, and `.dev.vars` (gitignored) holds the test
secret. Copy `.dev.vars.example` to `.dev.vars` if it is missing.

## One-time Cloudflare setup (manual)

Do these once in the Cloudflare dashboard or CLI before the contact form works in production:

1. **Email Routing** on `minervasharp.com`: enable it (this adds MX/SPF records; if
   the domain already receives mail elsewhere, review those records first), then add
   and verify `minervasharp@outlook.com` as a destination address. Sending to a
   verified destination is free on the Workers Free plan.
2. **Turnstile widget** for `minervasharp.com`, `www.minervasharp.com`, `localhost`,
   and `127.0.0.1`. Put the sitekey in `VITE_TURNSTILE_SITEKEY` (build-time), and run
   `wrangler secret put TURNSTILE_SECRET` with the widget's secret.
3. The custom domains `minervasharp.com` / `www.minervasharp.com` require the zone to
   exist on account `21232911d5ff54ed8670b22255d4fade` before they bind.

## Deploy

- Manual: `npm run deploy`.
- CI: `.github/workflows/deploy.yml` deploys on push to `main`. Set repository secrets
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `VITE_TURNSTILE_SITEKEY`.
