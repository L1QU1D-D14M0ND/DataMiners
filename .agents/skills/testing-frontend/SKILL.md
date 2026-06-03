---
name: testing-dataminers-frontend
description: Test the DataMiners Next.js frontend end-to-end. Use when verifying frontend UI changes, error handling, matchmaking, or game session flows.
---

# Testing DataMiners Frontend

## Prerequisites

- Node.js and npm installed
- Run `npm install` in the `Data-Miners/` directory
- No backend (PHP/Redis) is required for frontend-only testing — the missing backend naturally triggers error paths

## Starting the Dev Server

```bash
cd Data-Miners && PORT=3000 npm run dev
```

The Next.js dev server runs on `http://localhost:3000`. It starts successfully even with pre-existing TypeScript errors (Next.js is lenient in dev mode).

## TypeScript Checks

```bash
cd Data-Miners && npx tsc --noEmit
```

There is a known pre-existing error in `components/game/game-canvas.tsx:143` (null vs undefined for matchId prop). This is not a regression — verify no NEW errors are introduced by your changes.

## Reaching Different UI States Without a Backend

The app requires authentication to reach the game/matchmaking views. Without a running backend, you need temporary code modifications in `app/game-client.tsx` to bypass auth:

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

## Known Issues

- **Settings modal `||` bug** (`settings-modal.tsx:119`): `onReturnToMenuWithWarning?.() || onReturnToMenu()` calls both functions because `void` is falsy. The "Return to Main Menu" button in settings both shows the exit warning AND navigates away. This is pre-existing and not related to error handling changes.
- **game-canvas.tsx:143 TypeScript error**: Pre-existing null vs undefined type mismatch for matchId prop.
- **Backend testing**: MatchmakingController, GameSessionController, and ColosseumService changes require PHP 8.3, Laravel, Redis, and MySQL. These cannot be tested in a frontend-only environment.

## Devin Secrets Needed

No secrets are required for frontend-only testing. A full-stack test would require database credentials and Redis connection details.
