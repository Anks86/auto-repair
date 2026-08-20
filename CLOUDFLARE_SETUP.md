# Cloudflare launch setup

The site is deployed on Cloudflare Workers Free with static assets. The Worker is connected to the approved GitHub repository, and `niagaraautorepair.com` is publicly reachable as its production custom domain. The production form and verified Gmail delivery test passed on August 19, 2026.

## Before the form can deliver real email

1. Completed: `niagaraautorepair.com` is onboarded to Cloudflare Email Routing on the Free plan.
2. Completed: `babbalautorepair@gmail.com` is a verified Cloudflare Email Routing destination.
3. Completed in code: the repository's `EMAIL` binding is restricted to that destination and to `website@niagaraautorepair.com` as the sender.
4. Completed: the managed Turnstile widget is created for `niagaraautorepair.com`. Add an approved preview hostname only if preview form testing is required.
5. Completed: these non-secret runtime values are defined in `wrangler.jsonc`, which is the source of truth for every GitHub deployment:

   - `TURNSTILE_SITE_KEY`, public configuration value
   - `EMAIL_FROM`, plain configuration value
   - `EMAIL_TO`, plain configuration value set to `babbalautorepair@gmail.com`
   - `TURNSTILE_HOSTNAME`, plain text, set to the exact live hostname

6. Completed: `TURNSTILE_SECRET_KEY` remains encrypted in Cloudflare and is declared as a required secret in `wrangler.jsonc`.
7. Completed August 19, 2026: a real production request showed success and arrived in the verified Gmail destination.

## GitHub and Cloudflare Workers

The separate public GitHub repository is `Anks86/auto-repair`, and Cloudflare's GitHub App is limited to this repository. It is connected to the `babbal-auto-repair` Worker, so approved commits to `main` deploy automatically. The build command is `npm run build`, and the deploy command is `npx wrangler deploy`.

Do not use a Pages or static drag-and-drop deployment for this project. Pages does not support the outbound email binding used by the form. The Worker configuration serves `dist` as static assets and runs Worker code only for `/api/*` requests.

## Privacy and cost

The form does not use a database and does not save requests on the website. It emails the verified Gmail destination through a destination-restricted Cloudflare Email binding, where Babbal and one authorized administrator follow the confirmed 90-day deletion policy. Turnstile screens automated spam. Cloudflare documents email from Workers to verified Email Routing destinations as free on any plan. This avoids the separate Workers Paid Email Sending product.

Never commit a `.dev.vars`, `.env`, account secret, or production Turnstile secret to GitHub.
