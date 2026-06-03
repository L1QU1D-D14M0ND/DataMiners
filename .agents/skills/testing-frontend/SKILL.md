---
name: testing-dataminers-frontend
description: Test the DataMiners Next.js frontend end-to-end. Use when verifying UI components, refactoring changes, or game UI behavior.
---

# Testing DataMiners Frontend

## Architecture

- **Frontend**: `Data-Miners/` — Next.js 15 + React + Phaser game engine
- **Backend**: `Backend/` — Laravel PHP (requires PHP 8.3)
- Backend URL defaults to `http://localhost:8000` (configurable via `NEXT_PUBLIC_BACKEND_URL` env var)

## Running the Frontend Dev Server

```bash
cd Data-Miners && npm install && npm run dev
```

The server starts on port 3000 (or next available port).

## App State Machine

The main app (`app/game-client.tsx`) has these states:

1. **"loading"** — Shows "Checking login status..." while fetching `/spa/user`
2. **"guest"** — Shows login/register page (when backend unreachable or not logged in)
3. **"admin_choice"** — Shows admin routing choice (for admin users)
4. **"authenticated"** — Shows MainMenu
5. **inMatchmaking** — Shows MatchmakingLobby
6. **gameStarted** — Shows GameCanvas (Phaser game)

## Testing Without Backend

Without the Laravel backend running, the `/spa/user` API call fails and the app shows the **"guest" state** (login page). This is useful for testing:
- `AuthBackground` / `AnimatedBackground` component
- Auth form components

## Testing MainMenu Without Backend (Auth Bypass)

To test components that require authentication (MainMenu, modals, game UI) without the backend:

1. In `app/game-client.tsx`, temporarily change the initial status state:
   ```ts
   // Change from:
   const [status, setStatus] = useState<...>("loading")
   // To:
   const [status, setStatus] = useState<...>("authenticated")
   ```

2. Also disable the `useEffect` that fetches `/spa/user` (it overrides the state back to "guest" on failure):
   ```ts
   useEffect(() => {
     // Comment out the fetchUser() call
     return () => {}
   }, [])
   ```

3. Refresh the page — MainMenu will render directly.

**Remember to revert these changes after testing.**

## Key Component Locations

| Component | Path | Visible in |
|-----------|------|------------|
| AnimatedBackground | `components/shared/animated-background.tsx` | Auth page, MainMenu |
| AuthBackground | `components/auth/auth-background.tsx` | Auth page (re-exports AnimatedBackground) |
| GameModal | `components/game/game-modal.tsx` | Settings, Profile, TechTree modals |
| MainMenu | `components/game/main-menu.tsx` | Authenticated state |
| SettingsModal | `components/game/settings-modal.tsx` | In-game (GameCanvas) |
| ProfileModal | `components/game/profile-modal.tsx` | MainMenu → PROFILE button |
| MatchmakingLobby | `components/matchmaking/matchmaking-lobby.tsx` | After clicking PVP MATCHMAKING |

## MainMenu Navigation

From the MainMenu, these buttons are available:
- **START OPERATION** — Starts game (needs equipped deck)
- **PVP MATCHMAKING** — Opens matchmaking lobby
- **PROFILE** — Opens ProfileModal (uses GameModal)
- **SETTINGS** — Opens SettingsScreen (in-menu settings)
- **CREDITS** — Shows credits
- **LOGOUT** — Signs out

## Build Validation

```bash
cd Data-Miners && npm run build
```

**Note**: There is a pre-existing type error in `game-canvas.tsx:143` (`string | null | undefined` vs `string | undefined`) that causes `npm run build` to fail at the type-checking phase. The compilation itself succeeds. This is unrelated to most PRs.

## Lint

No ESLint config file exists yet — `npm run lint` might prompt for setup or error. Use `npx eslint .` with caution.

## Devin Secrets Needed

No secrets are required for frontend-only testing. If testing with the Laravel backend:
- Database credentials (check `Backend/.env.example`)
- PHP 8.3 installation
