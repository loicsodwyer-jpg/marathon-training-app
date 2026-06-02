# Push Notifications Setup

Step 26 adds backend subscription storage and backend test pushes. Step 27 adds scheduled reminders sent through backend functions.

## 1. Generate VAPID Keys

Run:

```bash
npm run generate:vapid
```

Copy both values. The public key is safe for the frontend. The private key is server-only.

## 2. Local Environment

Create `.env.local` from `.env.example`:

```bash
VITE_VAPID_PUBLIC_KEY=your_public_key
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:loic.s.odwyer@gmail.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_scheduler_secret
```

Never commit `.env.local`. Never put `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `CRON_SECRET` in frontend code.

## 3. Supabase Table

1. Create/open the Supabase project.
2. Open SQL Editor.
3. Run `supabase/push_subscriptions.sql`.
4. Run `supabase/push_reminders.sql`.
5. Confirm the `public.push_subscriptions` and `public.push_reminders` tables exist.

The app does not query this table directly from the browser. Vercel Functions use the service-role key server-side.

The API functions use ESM-style imports with explicit `.js` extensions because TypeScript NodeNext/Node16 resolution requires them.
The Vercel API functions require Node typings because they use `process.env` and `Buffer`.

## 4. Vercel Environment Variables

Add these to Vercel Project Settings:

- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `PUSH_ALLOWED_ORIGIN` optional

Redeploy after adding or changing environment variables.

## 5. Local Testing

Normal Vite dev serves the frontend:

```bash
npm run dev
```

Vercel API routes need Vercel’s local runtime:

```bash
vercel dev
```

If you do not use `vercel dev`, backend buttons may show “Push backend is not reachable” locally. The deployed Vercel app is the main test target.

## 6. iPhone Test Flow

1. Deploy to Vercel with the environment variables above.
2. Open the deployed HTTPS URL in Safari.
3. Add the app to the Home Screen or open the existing Home Screen app.
4. Go to Settings -> Notifications.
5. Tap Enable notifications.
6. Tap Create and save subscription.
7. Confirm a row appears in `public.push_subscriptions`.
8. Tap Check backend status.
9. Tap Send backend test push.
10. Confirm “Marathon 2:55 backend test” arrives.

## 7. Step 27 Scheduled Reminders

1. Run `supabase/push_reminders.sql` in Supabase after the subscriptions SQL.
2. Add `CRON_SECRET` to Vercel Project Settings and redeploy.
3. Add GitHub repo secrets:
   - `PUSH_CRON_URL`
   - `PUSH_CRON_SECRET`
4. Set `PUSH_CRON_URL` to the deployed scheduler endpoint, for example `https://marathon-training-app-eight.vercel.app/api/push/reminders/send-due`.
5. Set `PUSH_CRON_SECRET` to the same value as Vercel `CRON_SECRET`.
6. Open Settings -> Notifications in the app.
7. Create/save the push subscription.
8. Choose a sync range, preview reminders, then sync reminders.
9. Confirm pending rows appear in `public.push_reminders`.
10. Test manually from GitHub -> Actions -> Send due push reminders -> Run workflow.

Scheduled workflows use UTC. Every 5 minutes is the shortest GitHub Actions schedule interval. GitHub may delay workflow starts under load, so delivery is best-effort within a few minutes.

## Troubleshooting

- Permission denied: re-enable notifications in iPhone/browser settings.
- iPhone shows unsupported: use iOS/iPadOS 16.4 or newer and open from the Home Screen app.
- Missing VAPID key: set `VITE_VAPID_PUBLIC_KEY` and redeploy.
- Backend env missing: set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` in Vercel.
- Scheduler 401: confirm GitHub `PUSH_CRON_SECRET` matches Vercel `CRON_SECRET`.
- No reminders pending: sync reminders from Settings -> Notifications and confirm the selected range has upcoming events.
- GitHub workflow not running: confirm GitHub Actions are enabled and repo secrets are present.
- Supabase table missing: run `supabase/push_subscriptions.sql` and `supabase/push_reminders.sql`.
- Expired subscription: remove the push subscription in the app, then create and save it again.
- Stale service worker: refresh the deployed app, or remove/reinstall the Home Screen app after redeploying.
