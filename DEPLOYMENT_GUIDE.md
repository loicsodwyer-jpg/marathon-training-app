# Loïc Marathon 2:55 Deployment Guide

This app deploys as a static Vite PWA. It does not need a backend, API keys, server secrets, Strava/Garmin credentials, or LLM API configuration.

## Local Final Checks

Run these before pushing or importing into Vercel:

```bash
npm install
npm run validate:plan
npm run build
npm run lint
npm run preview
```

For phone testing on the same network, you can also run:

```bash
npm run preview:host
```

## GitHub Push

1. Create or open the GitHub repository for this app.
2. Commit the project files, including `vercel.json`, `vite.config.ts`, `public/icons`, and the generated documentation.
3. Do not commit local backups, `.env` files, `node_modules`, `dist`, or browser-exported private data.
4. Push the branch to GitHub.

## Vercel Import

1. In Vercel, choose **Add New Project**.
2. Import the GitHub repository.
3. Use these settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy.
5. Open the deployed HTTPS URL and confirm the app loads.

The root `vercel.json` rewrites all SPA paths to `index.html`, which protects future client-side navigation and PWA refreshes.

## iPhone Home Screen Install

1. Open the deployed HTTPS URL in Safari on iPhone.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. If Safari shows **Open as Web App**, leave it enabled.
5. Tap **Add**.
6. Launch the app from the new Home Screen icon.

The app should open in standalone mode with the dark theme colour and app icon.

## Data Migration From Localhost

Local data is stored per browser origin. That means:

- `localhost` data is separate from the deployed Vercel URL.
- Safari on iPhone is separate from desktop Chrome/Edge.
- Clearing browser data can remove local logs, schedule edits, plan overrides, and fuelling preferences.

Recommended migration:

1. Open the local app where your data currently lives.
2. Go to **Settings → Data management**.
3. Export a full JSON backup.
4. Open the deployed app.
5. Go to **Settings → Data management**.
6. Import the backup.
7. Confirm Today, Week, Plan adjustments, Log, Dashboard, Calendar edits, and Settings data look correct.

## Offline Test

1. Open the deployed app online once.
2. Wait a few seconds for the service worker and app shell cache to settle.
3. On iPhone, enable Airplane Mode.
4. Reopen the Home Screen app.
5. Check that these still open:
   - Today
   - Week
   - Plan
   - Log
   - Dashboard
   - Settings
6. Confirm local logs and adjusted plans still appear.

## PWA Metadata Checks

In browser DevTools, check **Application → Manifest** and **Application → Service Workers**:

- App name: `Loïc Marathon 2:55`
- Short name: `Marathon 2:55`
- Display: `standalone`
- Theme/background colour present
- Icons load from `/icons/icon.svg` and `/icons/maskable-icon.svg`
- Service worker is active after the first load

## Notes

- No deployment environment variables are required.
- No API key belongs in the frontend.
- Full backups are the safest way to move local data between devices or origins.
