---
name: testing-dataminers-backend
description: Test the DataMiners Laravel backend end-to-end. Use when verifying migrations, models, controllers, matchmaking, or game session API changes.
---

# Testing DataMiners Backend

## Architecture

- **Backend**: `Backend/` — Laravel 13 + PHP 8.3
- **Database**: SQLite by default (configured in `.env.example` as `DB_CONNECTION=sqlite`)
- **Frontend**: `Data-Miners/` — Next.js (not needed for backend-only testing)

## Prerequisites

- PHP 8.3 with extensions: cli, mbstring, xml, curl, sqlite3, zip, dom, tokenizer
- Composer
- No MySQL/Redis required for basic testing — SQLite works out of the box

## Installing PHP 8.3 (if not in snapshot)

```bash
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update -qq
sudo apt-get install -y php8.3 php8.3-cli php8.3-mbstring php8.3-xml php8.3-curl php8.3-sqlite3 php8.3-zip unzip
sudo curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

## Setting Up the Backend

```bash
cd Backend
cp .env.example .env
touch database/database.sqlite
composer install --no-interaction
php artisan key:generate
php artisan migrate --force
```

## Running Tests

```bash
# All tests
cd Backend && php artisan test

# Specific test class
php artisan test --filter=GameSessionTest

# Specific test method
php artisan test --filter=test_winner_id_mass_assignment_works
```

## Existing Test Suites

| Test File | What It Covers |
|-----------|----------------|
| `tests/Unit/Models/GameSessionTest.php` | GameSession model: opponent lookups, state updates, scopes |
| `tests/Unit/Models/MatchmakingQueueTest.php` | Matchmaking queue model |
| `tests/Unit/Services/CardStatisticsServiceTest.php` | Card win-rate statistics |
| `tests/Unit/Services/ColosseumServiceTest.php` | External matchmaking API integration |
| `tests/Unit/Services/UserLeaderboardServiceTest.php` | Leaderboard ranking queries |
| `tests/Feature/GameResultTest.php` | Game result API endpoints |
| `tests/Feature/Auth/` | Authentication flows (login, register, password) |

## Quick Schema Verification

```bash
# List columns for a table
php artisan tinker --execute="echo json_encode(\Illuminate\Support\Facades\Schema::getColumnListing('game_sessions'));"
```

## Key Notes

- The backend uses `RefreshDatabase` trait in tests — each test gets a fresh SQLite database
- The `Role` model must be seeded in setUp (`Role::forceCreate(['name' => 'Player'])`) before creating Users
- Foreign key constraints are enforced in SQLite — test them with `expectException(QueryException::class)`
- Broadcasting events (MatchEnded, GameStateChanged, CardUsed) may fail without Redis, but are wrapped in try/catch in controllers so they don't block the main flow
- Seeder passwords are configured via `SEED_ADMIN_PASSWORD` and `SEED_TEST_PASSWORD` env vars
