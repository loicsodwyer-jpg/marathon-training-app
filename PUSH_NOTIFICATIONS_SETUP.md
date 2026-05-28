# Push Notifications Setup

Step 26 adds backend subscription storage and backend test pushes. It does not schedule reminders yet; scheduled delivery comes in Step 27.

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
```

Never commit `.env.local`. Never put `VAPID_PRIVATE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## 3. Supabase Table

1. Create/open the Supabase project.
2. Open SQL Editor.
3. Run `supabase/push_subscriptions.sql`.
4. Confirm the `public.push_subscriptions` table exists.

The app does not query this table directly from the browser. Vercel Functions use the service-role key server-side.

## 4. Vercel Environment Variables

Add these to Vercel Project Settings:

- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
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

## Troubleshooting

- Permission denied: re-enable notifications in iPhone/browser settings.
- iPhone shows unsupported: use iOS/iPadOS 16.4 or newer and open from the Home Screen app.
- Missing VAPID key: set `VITE_VAPID_PUBLIC_KEY` and redeploy.
- Backend env missing: set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
- Supabase table missing: run `supabase/push_subscriptions.sql`.
- Expired subscription: remove the push subscription in the app, then create and save it again.
- Stale service worker: refresh the deployed app, or remove/reinstall the Home Screen app after redeploying.
