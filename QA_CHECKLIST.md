# Loïc Marathon 2:55 QA Checklist

Use this checklist before deployment or iPhone testing. The app is local-first, so keep a backup export handy before testing destructive flows.

## 1. Core Commands

- `npm install`
- `npm run generate:icons`
- `npm run generate:vapid`
- `npm run validate:plan`
- `npm run build`
- `npm run lint`
- `npm run preview`

## 2. Main Tabs

- Today: date picker, log button, hourly calendar, run card, strength card, nutrition/fuelling card.
- Week: vertical week-at-a-glance list, weekly grocery list, collapsed day cards, expanded details, completed/adjusted states.
- Plan: collapsed week sections, search, filters, date jump, adjustment manager, day-card navigation.
- Log: planned session summary, save/edit/delete log, strength completion, persisted values after refresh.
- Dashboard: mileage, completion, readiness/risk copy, long-run progression, revised 38 km peak and race day.

## 3. Settings Subpages

- Appearance: dark/light toggle persists.
- Install/offline: install status, online/offline status, iPhone Home Screen instructions.
- Calendar export: current week, next 4 weeks, full plan, custom range, validation, `.ics` download.
- Data management: backup export/import, CSV export, clear logs, clear calendar edits, clear plan adjustments, clear grocery checkmarks, clear all local data.
- Notifications: support status, permission request, local test notification, backend subscription status, backend test push, reminder preview.
- Strength library: Gym A, Gym B, Mini C details, illustrations, start live session.
- Nutrition library: meal templates, Maurten fuelling preferences, reset defaults, grocery list note.
- Integrations: future-feature copy only, no login or API key flow.
- About: plan period, local storage/privacy, roadmap.

## 4. Key Workflows

- Log a run: select a date, save distance/duration/HR/notes, refresh, confirm Today/Week/Dashboard update.
- Start/save strength session: start Gym A or Mini C, complete a few sets, end, save, confirm strength completion updates.
- Weekly grocery list: open Week, expand Grocery list, tick items, refresh, confirm checkmarks persist, copy list, reset checks.
- Apply/reset plan adjustment: generate an Achilles adjustment, approve, confirm Today/Week/Plan/Dashboard use adjusted plan, reset it.
- ChatGPT fallback: generate prompt, paste valid JSON, preview, apply, reset; invalid JSON should show errors without crashing.
- Export/import backup: export full JSON, import in merge and replace modes, confirm newer fields survive.
- Export `.ics` calendar: export a long-run week with fuelling reminders, inspect descriptions for adjusted plan and Maurten notes.
- Notification foundation: open Settings -> Notifications, request permission from a user tap, send a local test notification, and check reminder preview copy.
- Backend push: create and save subscription, confirm Supabase row, check backend status, send backend test push, then remove subscription.
- Scheduled reminders: preview next 7 days, sync reminders, confirm pending Supabase rows, refresh synced reminders, clear synced reminders, and confirm pending rows become cancelled.
- Due reminder delivery: call `/api/push/reminders/send-due` with `CRON_SECRET` or run the GitHub workflow manually, confirm due reminders send and rows become sent.
- Offline/PWA check: build, preview, load once, switch DevTools network offline, refresh, confirm app shell and local data still load.

## 5. Important Dates To Test

- 2026-06-02: early easy/recovery day and short-run fuelling.
- 2026-06-09: Week 2 quality session, 10 x 400 m.
- 2026-07-16: festival/social context and lighter grocery list.
- 2026-09-27: Week 17 marathon simulation, 38 km, full fuel test, peak grocery list.
- 2026-10-18: Amsterdam Marathon race day and race-week grocery list.

## 6. iPhone Pre-Deployment Checks

- Safe areas: sticky tab headers, Settings overlay, bottom nav, and full-screen modals avoid the notch/home indicator.
- Bottom nav: five tabs only; no modal actions are covered by the nav.
- Modals: Adjust Plan, ChatGPT fallback, Nutrition, Strength, Live Strength, Calendar Export, Import Backup, Activity, and Confirm dialogs scroll to the bottom.
- Date picker: opens in app style, fits the screen, closes after selection, supports quick dates.
- Text fit: long workout names wrap cleanly in Today, Week, Plan, and calendar blocks.
- Offline loading: after first load, Today/Week/Plan/Log/Dashboard/Settings open without network.

## 7. App Icon Checks

- Source icon is stored at `public/icons/source-app-icon.png` or supported `.jpg`, `.jpeg`, `.webp`.
- `npm run generate:icons` creates PNG app icons, maskable icons, Apple touch icon, and favicons.
- `index.html` links `/icons/apple-touch-icon.png`, `/icons/favicon-32.png`, and `/icons/favicon-16.png`.
- Manifest lists `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-icon-192.png`, and `/icons/maskable-icon-512.png`.
- After changing icons, delete the old iPhone Home Screen icon and add the app again. iOS may cache old icons.

## 8. Deployment and Home Screen Checks

- Deployed HTTPS URL opens on desktop and iPhone Safari.
- Vercel uses framework preset Vite, build command `npm run build`, and output directory `dist`.
- Manifest is valid and shows Loïc Marathon 2:55, standalone display, theme colours, and PNG icons.
- Service worker is active after the first deployed load.
- App can be added to the iPhone Home Screen from Safari.
- Home Screen launch opens standalone mode, not a normal Safari tab.
- Offline mode works after one online load.
- Full JSON backup imports successfully on the deployed origin/iPhone.
- Local logs, schedule edits, plan overrides, grocery checkmarks, and fuelling preferences persist after closing and reopening the Home Screen app.

## 9. Notification Foundation Checks

- iPhone/iPad push testing uses iOS/iPadOS 16.4 or newer.
- App is opened from the Home Screen, not only Safari, before enabling iPhone push notifications.
- Deployed URL is HTTPS; localhost is acceptable for local browser tests.
- Settings -> Notifications shows Notification API, service worker, PushManager, secure context, standalone mode, and permission status.
- Permission is only requested after tapping Enable notifications.
- Local test notification displays when permission is granted and tapping it opens/focuses the app.
- `VITE_VAPID_PUBLIC_KEY` is public; no private VAPID key is stored in frontend code.
- Vercel has `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase has the `public.push_subscriptions` table from `supabase/push_subscriptions.sql`.
- Supabase has the `public.push_reminders` table from `supabase/push_reminders.sql`.
- Create and save subscription stores a row in Supabase without exposing keys in the UI.
- Check backend status reports saved/active for the current endpoint.
- Send backend test push arrives on the device.
- Sync reminders uploads pending rows without exposing subscription keys.
- Clear synced reminders marks pending rows cancelled without deleting sent history.
- Send due reminders requires `CRON_SECRET`; wrong or missing secrets return 401.
- GitHub Actions workflow uses `PUSH_CRON_URL` and `PUSH_CRON_SECRET`, and scheduled runs are best-effort every 5 minutes UTC.
- Remove push subscription unsubscribes the browser and marks the Supabase row inactive.
- Reminder preview, sync, clear, and due delivery all work from Settings -> Notifications.
- Service worker still precaches the app shell and offline mode still works after the notification push handler changes.
