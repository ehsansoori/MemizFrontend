# Memiz Frontend

React + Vite flashcard workspace (private beta).

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Environment variables

Vite reads env files from the project root. **Restart `npm run dev` after any env change.**

| File | Purpose |
|------|---------|
| `.env.local` | Your machine-only secrets (gitignored) |
| `.env.development` | Shared dev defaults (optional) |
| `.env.example` | Template — copy values into `.env.local` |

### API base URL

```env
VITE_API_BASE_URL=https://localhost:7042
```

### Google sign-in (`VITE_GOOGLE_CLIENT_ID`)

Required for **Continue with Google** on the login screen.

#### 1. Get a Google Client ID

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services** → **Credentials**.
4. **Create credentials** → **OAuth client ID**.
5. Application type: **Web application**.
6. **Authorized JavaScript origins** (dev example):
   - `http://localhost:5173`
7. Copy the **Client ID** (ends with `.apps.googleusercontent.com`).

#### 2. Add it to `.env.local`

Create or edit `frontend/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

Do **not** commit real client IDs. `.env.local` is ignored by git (`*.local` in `.gitignore`).

#### 3. Restart Vite

Stop the dev server (`Ctrl+C`) and run:

```bash
npm run dev
```

The app reads the value via:

```ts
import.meta.env.VITE_GOOGLE_CLIENT_ID
```

(centralized in `src/config/env.ts`).

#### If Google auth is not configured

The app still loads. The login page shows a friendly setup message instead of crashing. Replace the placeholder `YOUR_GOOGLE_CLIENT_ID` in `.env.local` with your real client ID.

## Auth flow

1. Login screen → **Continue with Google**
2. Frontend sends Google ID token to `POST /api/auth/google` as `{ "credential": "<jwt>" }`
3. Backend returns `{ token, email, name }` (JWT for your API)
4. Token + user stored in Zustand and `localStorage` (`memiz-auth`)
5. API requests include `Authorization: Bearer <token>`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
