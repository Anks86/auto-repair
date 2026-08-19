# Babbal Auto Repair website

A static-first, bilingual website for Babbal (Mobile Mechanic) Auto Repair in the Niagara Region. English is the default experience and the complete French version is available under `/fr/`.

The site is designed for fast mobile access. Its primary actions are Call, Text, and Request service. It includes confirmed mobile-service scope, urgent roadside and towing guidance, transparent call-out minimums, Niagara coverage, consented Google review excerpts, owner-supplied work photos, privacy and accessibility information, and a secure Cloudflare form handler.

## Current status

The website has passed responsive, interaction, accessibility, link, form, security, and Cloudflare build checks. The `babbal-auto-repair` Worker is deployed from this repository, its production variables and restricted email binding are configured, and `niagaraautorepair.com` is publicly reachable as the custom domain. Email Routing is enabled, `babbalautorepair@gmail.com` is verified as the destination, and the Turnstile widget is configured for the production hostname. One successful live inbox test is the remaining launch check.

## Local setup

Requirements: Node.js 20 or newer.

```sh
npm install
npm run qa
```

The QA command builds the site and starts the local no-send preview. Test submissions are simulated and do not email customer data.

Always use `npm run qa` for local review. Do not serve the project source folder with a generic static file server because the French routes are generated inside `dist` during the build.

Useful commands:

```sh
npm run build
npm test
npm run audit
npm run check:worker
```

The production-ready static output is written to `dist`.

## Hosting

The prepared target is a Cloudflare Worker with static assets. Use `npm run build` as the Workers Builds build command and `npx wrangler deploy` as the deploy command. Static files are served directly by Cloudflare, while only `/api/*` requests invoke the Worker. The request form uses a destination-restricted Cloudflare Email binding, which is not supported by Pages.

See `CLOUDFLARE_SETUP.md` for the account-dependent launch steps. Never commit `.dev.vars`, `.env`, account secrets, or production Turnstile secrets.

## Content rights

The Google review excerpts are reproduced with the reviewers' confirmed consent. Business photos and brand assets were supplied or approved for this project. Their presence in this repository does not grant third parties permission to reuse them. No open-source licence is included.

## Pro bono project notice

This website was developed pro bono to support a local small business. The repository owner contributed website design and technical implementation. The repository owner is not the provider of automotive or towing services, is not a party to customer transactions, and does not control or warrant the business's services, workmanship, prices, timing, or customer dealings. Babbal Auto Repair is responsible for its public business information and service delivery.

This notice is factual project documentation, not legal advice or a guarantee that liability is eliminated. Ontario legal advice should be obtained before relying on it as legal protection.
