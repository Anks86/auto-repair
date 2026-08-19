# Cloudflare launch setup

The site is prepared for Cloudflare Pages Free at `niagaraautorepair.com`. The domain is registered in the approved Cloudflare account, but the site is not deployed yet.

## Before the form can deliver real email

1. Completed: `niagaraautorepair.com` is onboarded to Cloudflare Email Routing on the Free plan.
2. Completed: `babbalautorepair@gmail.com` is a verified Cloudflare Email Routing destination.
3. Completed in code: the repository's `EMAIL` binding is restricted to that destination and to `website@niagaraautorepair.com` as the sender.
4. Completed: the managed Turnstile widget is created for `niagaraautorepair.com`. Add the approved Pages preview hostname only if preview form testing is required.
5. Add these values in Cloudflare Pages under Variables and Secrets:

   - `TURNSTILE_SITE_KEY`, encrypted
   - `TURNSTILE_SECRET_KEY`, encrypted
   - `EMAIL_FROM`, encrypted
   - `EMAIL_TO`, encrypted, set to `babbalautorepair@gmail.com`
   - `TURNSTILE_HOSTNAME`, plain text, set to the exact live hostname

6. Send a real test request and confirm it arrives in Gmail before announcing the form.

## GitHub and Cloudflare Pages

Create a separate GitHub repository for this website. Connect that repository to a new Cloudflare Pages project so changes on the approved production branch deploy automatically. Use `npm run build` as the build command and `dist` as the output directory.

Do not use Cloudflare's dashboard drag-and-drop deployment for this project because the form uses Pages Functions.

## Privacy and cost

The form does not use a database and does not save requests on the website. It emails the verified Gmail destination through a destination-restricted Cloudflare Email binding, where Babbal and one authorized administrator follow the confirmed 90-day deletion policy. Turnstile screens automated spam. Cloudflare documents email from Workers to verified Email Routing destinations as free on any plan. This avoids the separate Workers Paid Email Sending product.

Never commit a `.dev.vars`, `.env`, account secret, or production Turnstile secret to GitHub.
