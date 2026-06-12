# Data Miners

A resource management game built with Laravel (backend) and Next.js (frontend).

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

5. **Redis** (for caching and queue management)
   - Download from [redis.io](https://redis.io/download)
   - Or use Memurai for Windows (recommended)
   - Start Redis server before running the application

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

**Terminal 3 - Redis (if not running as service):**
```bash
redis-server
```

**Terminal 4 - Laravel Queue Worker (for background jobs):**
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

Then in a separate terminal, run the frontend:
```bash
cd Data-Miners
npm run dev
```

## Development Workflow

1. Make sure Redis is running
2. Start the backend server (either `php artisan serve` or `composer run dev`)
3. Start the frontend server (`npm run dev`)
4. Open your browser to `http://localhost:3000`

## Additional Services

### Redis Configuration

Make sure Redis is running for:
- Caching
- Queue management
- Real-time broadcasting (if using Laravel Echo)

Default Redis configuration in `.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Broadcasting (Optional)

If using real-time features with Laravel Echo and Pusher:
1. Install the Laravel Echo server:
   ```bash
   npm install -g laravel-echo-server
   ```
2. Configure Pusher credentials in `.env`
3. Start the Echo server:
   ```bash
   laravel-echo-server start
   ```

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

### Redis Connection Issues

- Ensure Redis server is running: `redis-cli ping` (should return PONG)
- Check Redis configuration in `.env`
- Verify Redis is not blocked by firewall

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
