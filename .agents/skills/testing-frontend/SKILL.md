---
name: testing-dataminers-frontend
description: Test the DataMiners Next.js frontend end-to-end. Use when verifying UI components, refactoring changes, error handling, matchmaking, or game session flows.
---

# Testing DataMiners Frontend

## Architecture

- **Frontend**: `Data-Miners/` — Next.js 15 + React + Phaser game engine
- **Backend**: `Backend/` — Laravel PHP (requires PHP 8.3)
- Backend URL defaults to `http://localhost:8000` (configurable via `NEXT_PUBLIC_BACKEND_URL` env var)

## Prerequisites

- Node.js and npm installed
- Run `npm install` in the `Data-Miners/` directory
- No backend (PHP/Redis) is required for frontend-only testing — the missing backend naturally triggers error paths

## Running the Frontend Dev Server

```bash
cd Data-Miners && npm install && npm run dev
```

The server starts on port 3000 (or next available port). Next.js dev mode starts successfully even with pre-existing TypeScript errors.

## TypeScript Checks

```bash
cd Data-Miners && npx tsc --noEmit
```

There is a known pre-existing error in `components/game/game-canvas.tsx:143` (null vs undefined for matchId prop). This is not a regression — verify no NEW errors are introduced by your changes.

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
- Error handling in `fetchUser` (console shows `"Failed to fetch user session:"`)

## Reaching Different UI States Without a Backend

The app requires authentication to reach the game/matchmaking views. Without a running backend, you need temporary code modifications in `app/game-client.tsx` to bypass auth.

### Method 1: Simple Auth Bypass (for component testing)

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

### Method 2: URL Parameter Override (for testing multiple states)

1. **Add a URL parameter reader** at the top of `GameClient()`:
   ```tsx
   const testMode = typeof window !== 'undefined' 
     ? new URLSearchParams(window.location.search).get('_test') 
     : null
   ```

2. **Override initial state** based on `testMode`:
   - `gameStarted`: `testMode === 'game'`
   - `matchId`: `testMode === 'game' ? 'test-match-123' : null`
   - `inMatchmaking`: `testMode === 'matchmaking'`
   - `user`: `testMode ? { id: 1, name: "TestUser", ... } : null`
   - `status`: `testMode ? "authenticated" : "loading"`

3. **Skip fetchUser** in test mode by adding `if (testMode) return` at the top of the fetchUser useEffect.

Then navigate to:
- `http://localhost:3000` — Login/register form (tests fetchUser error handling)
- `http://localhost:3000?_test=matchmaking` — Matchmaking lobby (tests poll failure tracking)
- `http://localhost:3000?_test=game` — Game UI with Phaser canvas (tests concede flow)

**Always revert these temporary modifications after testing.**

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

## Key Test Flows

### Error Handling (fetchUser)
- Navigate to `http://localhost:3000` without backend
- Console should show `"Failed to fetch user session:"` followed by error details
- App should render the login form (status = "guest"), not crash

### Matchmaking Consecutive Failure Tracking
- Navigate to `?_test=matchmaking`
- Wait ~12 seconds for 5 poll failures
- Console should show numbered attempts: `"Failed to poll queue status (attempt N):"`
- After 5 failures, UI should show "Lost connection to matchmaking server. Please try again."
- Polling should STOP (no more console errors)

### Concede Error Message
- Navigate to `?_test=game`
- Trigger the exit warning modal (the Settings modal's "Return to Main Menu" has a pre-existing `||` bug — you may need a temporary Escape key handler in `game-ui.tsx` to trigger the modal directly)
- Click CONCEDE
- Red error text "Failed to concede. Please try again." should appear in the modal
- Console should show `"Failed to concede match:"` with error details
- CONCEDE button should return to non-loading state

## Build Validation

```bash
cd Data-Miners && npm run build
```

**Note**: There is a pre-existing type error in `game-canvas.tsx:143` (`string | null | undefined` vs `string | undefined`) that causes `npm run build` to fail at the type-checking phase. The compilation itself succeeds. This is unrelated to most PRs.

## Lint

No ESLint config file exists yet — `npm run lint` might prompt for setup or error. Use `npx eslint .` with caution.

## Known Issues

- **Settings modal `||` bug** (`settings-modal.tsx:119`): `onReturnToMenuWithWarning?.() || onReturnToMenu()` calls both functions because `void` is falsy. The "Return to Main Menu" button in settings both shows the exit warning AND navigates away. This is pre-existing and not related to error handling changes.
- **game-canvas.tsx:143 TypeScript error**: Pre-existing null vs undefined type mismatch for matchId prop.
- **Backend testing**: MatchmakingController, GameSessionController, and ColosseumService changes require PHP 8.3, Laravel, Redis, and MySQL. These cannot be tested in a frontend-only environment.

## Devin Secrets Needed

No secrets are required for frontend-only testing. If testing with the Laravel backend:
- Database credentials (check `Backend/.env.example`)
- PHP 8.3 installation
- Redis connection details
