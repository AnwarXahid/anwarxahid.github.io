# Put the pilot online

**Pushing this branch alone will not launch Quizora.** GitHub Pages serves the static portfolio and UI; Cloudflare Workers and D1 serve published quizzes, submissions, and results. The repository's Pages workflow is manual and runs only from `master`. AI stays off.

## 1. Prepare the Cloudflare API

1. Create a Cloudflare account and log in locally with `npx wrangler login`.
2. Run `npx wrangler d1 create quizora-production`. Copy `worker/wrangler.production.example.toml` to `worker/wrangler.production.toml`, then replace `REPLACE_WITH_D1_DATABASE_ID` with the ID printed by Wrangler. The copied file is ignored by Git. Check that `ALLOWED_ORIGINS` is your exact HTTPS site origin.
3. Create a [Turnstile widget](https://developers.cloudflare.com/turnstile/get-started/) for `anwarxahid.github.io`. Keep its secret key private; the site key will be a GitHub Actions variable. The UI uses the widget action `create` and the Worker validates the action and hostname.
4. Apply the production schema and deploy the Worker:

   ```sh
   npx wrangler d1 migrations apply quizora-production --remote --config worker/wrangler.production.toml
   npx wrangler deploy --config worker/wrangler.production.toml
   ```

5. Set a random 64-character hexadecimal `ADMIN_SECRET` and the Turnstile `TURNSTILE_SECRET` with `npx wrangler secret put ADMIN_SECRET --config worker/wrangler.production.toml` and `npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.production.toml`. Never place them in GitHub Pages variables or a `PUBLIC_*` setting. Leave `AI_ENABLED=false`; no AI keys or local model are needed for this pilot.
6. Open `https://<your-worker>.workers.dev/v1/health` and confirm `{"ok":true}`. Record the Worker HTTPS URL ending in `/v1`.

Cloudflare documents [D1 creation and remote migrations](https://developers.cloudflare.com/workers/wrangler/commands/d1/) and [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/). Review the target account and database before applying the remote migration.

## 2. Configure GitHub Pages

1. The Pages workflow includes the public Worker URL and Turnstile site key as defaults. You can override them with `PUBLIC_API_BASE` and `PUBLIC_TURNSTILE_SITE_KEY` repository variables under **Settings → Secrets and variables → Actions → Variables**. These are public build values, not secrets. `PUBLIC_ENABLE_AI` is fixed to `false` in the pilot workflow.
2. Merge `feature/astro-quizora` into `master` and push `master`. Wait for the **Verify** workflow to pass. This push does not run the manual Pages deployment workflow.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Then open **Actions → Deploy static site (manual) → Run workflow**, select `master`, and run it. This replaces the old branch-based Jekyll publishing path when the workflow completes.
4. Visit `https://anwarxahid.github.io/`, `/exam/`, and `/exam/qr/`. Create a small test quiz, scan its participant QR code in a separate browser, submit an answer, open the private management link, and delete the test quiz afterward.

GitHub documents the [Pages source setting](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [repository Actions variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables).

## Later updates

Pushes to `master` run checks. To publish a changed frontend, run **Deploy static site (manual)** again. Worker code changes require a separate reviewed `wrangler deploy`; D1 schema changes require a separate reviewed remote migration. A GitHub push by itself never deploys the Worker or database.

The QR generator and portfolio are static; they can load even if the API is down. Creation, joining, saving, and results need the Worker and D1. Hosted CPU and quota use, Turnstile, translations, privacy, and school use should be reviewed before inviting a broad audience. Keep this GitHub Pages pilot noncommercial; [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) restrict sites primarily serving commercial SaaS.
