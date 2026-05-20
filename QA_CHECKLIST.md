# Loïc Marathon 2:55 QA Checklist

Use this checklist before deployment or iPhone testing. The app is local-first, so keep a backup export handy before testing destructive flows.

## 1. Core Commands

- `npm install`
- `npm run validate:plan`
- `npm run build`
- `npm run lint`
- `npm run preview`

## 2. Main Tabs

- Today: date picker, log button, hourly calendar, run card, strength card, nutrition/fuelling card.
- Week: vertical week-at-a-glance list, collapsed day cards, expanded details, completed/adjusted states.
- Plan: collapsed week sections, search, filters, date jump, adjustment manager, day-card navigation.
- Log: planned session summary, save/edit/delete log, strength completion, persisted values after refresh.
- Dashboard: mileage, completion, readiness/risk copy, long-run progression, revised 38 km peak and race day.

## 3. Settings Subpages

- Appearance: dark/light toggle persists.
- Install/offline: install status, online/offline status, iPhone Home Screen instructions.
- Calendar export: current week, next 4 weeks, full plan, custom range, validation, `.ics` download.
- Data management: backup export/import, CSV export, clear logs, clear calendar edits, clear plan adjustments, clear all local data.
- Strength library: Gym A, Gym B, Mini C details, illustrations, start live session.
- Nutrition library: meal templates, Maurten fuelling preferences, reset defaults.
- Integrations: future-feature copy only, no login or API key flow.
- About: plan period, local storage/privacy, roadmap.

## 4. Key Workflows

- Log a run: select a date, save distance/duration/HR/notes, refresh, confirm Today/Week/Dashboard update.
- Start/save strength session: start Gym A or Mini C, complete a few sets, end, save, confirm strength completion updates.
- Apply/reset plan adjustment: generate an Achilles adjustment, approve, confirm Today/Week/Plan/Dashboard use adjusted plan, reset it.
- ChatGPT fallback: generate prompt, paste valid JSON, preview, apply, reset; invalid JSON should show errors without crashing.
- Export/import backup: export full JSON, import in merge and replace modes, confirm newer fields survive.
- Export `.ics` calendar: export a long-run week with fuelling reminders, inspect descriptions for adjusted plan and Maurten notes.
- Offline/PWA check: build, preview, load once, switch DevTools network offline, refresh, confirm app shell and local data still load.

## 5. Important Dates To Test

- 2026-06-02: early easy/recovery day and short-run fuelling.
- 2026-06-09: Week 2 quality session, 10 x 400 m.
- 2026-07-16: festival/social context.
- 2026-09-27: Week 17 marathon simulation, 38 km and full fuel test.
- 2026-10-18: Amsterdam Marathon race day.

## 6. iPhone Pre-Deployment Checks

- Safe areas: top bar, Settings overlay, bottom nav, and full-screen modals avoid the notch/home indicator.
- Bottom nav: five tabs only; no modal actions are covered by the nav.
- Modals: Adjust Plan, ChatGPT fallback, Nutrition, Strength, Live Strength, Calendar Export, Import Backup, Activity, and Confirm dialogs scroll to the bottom.
- Date picker: opens in app style, fits the screen, closes after selection, supports quick dates.
- Text fit: long workout names wrap cleanly in Today, Week, Plan, and calendar blocks.
- Offline loading: after first load, Today/Week/Plan/Log/Dashboard/Settings open without network.

## 7. Deployment and Home Screen Checks

- Deployed HTTPS URL opens on desktop and iPhone Safari.
- Vercel uses framework preset Vite, build command `npm run build`, and output directory `dist`.
- Manifest is valid and shows Loïc Marathon 2:55, standalone display, theme colours, and icons.
- Service worker is active after the first deployed load.
- App can be added to the iPhone Home Screen from Safari.
- Home Screen launch opens standalone mode, not a normal Safari tab.
- Offline mode works after one online load.
- Full JSON backup imports successfully on the deployed origin/iPhone.
- Local logs, schedule edits, plan overrides, and fuelling preferences persist after closing and reopening the Home Screen app.
