# Data Miners

A resource management game built with Laravel (backend) and Next.js (frontend).

## Tech Stack

### Backend
- **Laravel 13.0** - PHP framework
- **PHP 8.3+** - Programming language
- **Laravel Sanctum 4.3** - API authentication
- **Laravel Breeze 2.4** - Authentication scaffolding
- **Predis 3.4** - Redis client for caching/queues
- **Socket.io 4.8.3** - WebSocket server for real-time features
- **Vite 8.0.0** - Asset bundler
- **Tailwind CSS 3.1.0** - CSS framework
- **Alpine.js 3.4.2** - Lightweight JavaScript framework
- **PHPUnit 12.5.12** - Testing framework
- **Laravel Pail 1.2.5** - Log viewer
- **Laravel Pint 1.27** - Code style tool
- **Faker 1.23** - Test data generation

### Frontend
- **Next.js 15.0.0** - React framework
- **React 19.2.0** - UI library
- **TypeScript 5** - Type system
- **Phaser 3.90.0** - 2D game engine
- **Socket.io-client 4.8.3** - WebSocket client for real-time features
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Headless UI components (dialog, collapsible, separator, slot, toast)
- **Lucide React 0.454.0** - Icon library
- **Sonner 1.7.4** - Toast notifications
- **next-themes 0.4.6** - Theme management (dark/light mode)
- **Axios 1.16.1** - HTTP client
- **Vitest 4.1.8** - Testing framework
- **Testing Library** - React testing utilities (@testing-library/react, @testing-library/jest-dom)
- **Web Audio API** - Native browser API for sound generation (no external library)

### Development Tools
- **concurrently 9.0.1** - Run multiple commands simultaneously
- **Composer** - PHP dependency manager
- **npm** - Node.js package manager

### Infrastructure
- **MySQL/PostgreSQL/SQLite** - Database options
- **Memurai/Redis** - Caching and queue management
- **Laragon** (Windows) - Development server (Apache/Nginx, MySQL, PHP)

## Project Structure

- **Backend/** - Laravel API backend
- **Data-Miners/** - Next.js frontend application

## Prerequisites

### Required Software

1. **PHP 8.3 or higher**
   - Download from [php.net](https://www.php.net/downloads)
   - Make sure PHP is added to your system PATH

2. **Composer** (PHP dependency manager)
   - Download from [getcomposer.org](https://getcomposer.org/download)
   - Run the installer and follow the prompts

3. **Node.js 18+ and npm**
   - Download from [nodejs.org](https://nodejs.org)
   - Choose the LTS version recommended for most users

4. **Laragon** (Recommended for Windows)
   - Download from [laragon.org](https://laragon.org/download)
   - Laragon includes Apache/Nginx, MySQL, and PHP
   - Install and start Laragon to run MySQL database
   - Default MySQL credentials:
     - Host: `localhost`
     - Port: `3306`
     - Username: `root`
     - Password: (empty)

5. **Memurai** (for caching and queue management)
   - Download from [memurai.com](https://www.memurai.com/get-memurai)
   - Start Memurai server before running the application

### Alternative Database Options

If you prefer not to use Laragon, you can use:
- **MySQL Standalone** - Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
- **PostgreSQL** - Download from [postgresql.org](https://www.postgresql.org/download/)
- **SQLite** - No installation required (configured by default in Laravel)

## Backend Setup (Laravel)

1. **Navigate to the Backend directory**
   ```bash
   cd Backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` file and configure your database:
   
   If using Laragon (MySQL):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=data_miners
   DB_USERNAME=root
   DB_PASSWORD=
   ```
   
   If using SQLite (default):
   ```env
   DB_CONNECTION=sqlite
   ```
   
   Also configure:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

4. **Generate application key**
   ```bash
   php artisan key:generate
   ```

5. **Create and run database migrations**
   
   If using MySQL, create the database first:
   ```bash
   # Using Laragon's MySQL
   mysql -u root -e "CREATE DATABASE data_miners;"
   ```
   
   Then run migrations:
   ```bash
   php artisan migrate
   ```

6. **Seed the database (optional)**
   ```bash
   php artisan db:seed
   ```

7. **Install Node dependencies for Vite**
   ```bash
   npm install
   ```

8. **Build frontend assets**
   ```bash
   npm run build
   ```

## Frontend Setup (Next.js)

1. **Navigate to the Data-Miners directory**
   ```bash
   cd Data-Miners
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (if needed)**
   - Create a `.env.local` file if you need to override API endpoints
   - By default, the frontend connects to `http://localhost:8000` (Laravel backend)

## Running the Application

### Option 1: Run Both Separately

**Terminal 1 - Backend:**
```bash
cd Backend
php artisan serve
```
Backend will run at `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd Data-Miners
npm run dev
```
Frontend will run at `http://localhost:3000`

**Terminal 3 - Memurai (if not running as service):**
```bash
memurai-server
```

**Terminal 4 - WebSocket Server (for real-time multiplayer):**
```bash
cd Backend
node socket-server.js
```

**Terminal 5 - Laravel Queue Worker (for background jobs):**
```bash
cd Backend
php artisan queue:work
```

### Option 2: Run Backend with All Services (Laravel Composer Script)

The Backend includes a convenience script to run all Laravel services:

```bash
cd Backend
composer run dev
```

This will start:
- Laravel server (port 8000)
- Queue worker
- Laravel logs (Pail)
- Vite dev server

Then in separate terminals, run the WebSocket server and frontend:
```bash
cd Backend
node socket-server.js
```

```bash
cd Data-Miners
npm run dev
```

Then in a separate terminal, run the frontend:
```bash
cd Data-Miners
npm run dev
```

## Development Workflow

1. Make sure Memurai is running
2. Start the backend server (either `php artisan serve` or `composer run dev`)
3. Start the WebSocket server (`node socket-server.js` in Backend directory)
4. Start the frontend server (`npm run dev`)
5. Open your browser to `http://localhost:3000`

## Additional Services

### Memurai Configuration

Make sure Memurai is running for:
- Caching
- Queue management

Default Memurai configuration in `.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### WebSocket Server

The project uses a custom Socket.io server for real-time features (match state synchronization, card usage notifications, match ended events). Start the WebSocket server:

```bash
cd Backend
node socket-server.js
```

The WebSocket server runs on port 6001 and is required for online multiplayer functionality.

## Troubleshooting

### Database Connection Issues

- Ensure Laragon/MySQL is running
- Verify database credentials in `.env`
- Make sure the database exists (for MySQL/PostgreSQL)
- Check that the database user has proper permissions

### Port Already in Use

If port 8000 or 3000 is already in use:
```bash
# Change Laravel port
php artisan serve --port=8001

# Change Next.js port
npm run dev -- -p 3001
```

### Composer/PHP Issues

- Ensure PHP 8.3+ is installed: `php -v`
- Ensure Composer is installed: `composer -v`
- Check PHP extensions are enabled (required: mbstring, openssl, pdo, tokenizer, xml)

### Node/npm Issues

- Ensure Node.js 18+ is installed: `node -v`
- Ensure npm is installed: `npm -v`
- Clear npm cache if needed: `npm cache clean --force`

### Memurai Connection Issues

- Ensure Memurai server is running: `memurai-cli ping` (should return PONG)
- Check Memurai configuration in `.env`
- Verify Memurai is not blocked by firewall

## Testing

### Backend Tests
```bash
cd Backend
php artisan test
```

### Frontend Tests
```bash
cd Data-Miners
npm test
```

## Production Deployment

For production deployment, refer to:
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## License

This project is open-sourced software licensed under the MIT license.
