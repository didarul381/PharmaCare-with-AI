# Installation guide

This guide covers three setups. Pick the one that matches your server.

- [A. Shared hosting / cPanel](#a-shared-hosting--cpanel)
- [B. VPS (Ubuntu + Nginx)](#b-vps-ubuntu--nginx)
- [C. Local computer (Windows / macOS / Linux)](#c-local-computer)
- [After installing](#after-installing) · [Updating](#updating) · [Backups](#backups) · [Troubleshooting](#troubleshooting)

---

## Requirements

| | Minimum |
|---|---|
| PHP | 8.3 or newer |
| PHP extensions | `pdo_mysql` (or `pdo_sqlite`), `mbstring`, `openssl`, `fileinfo`, `curl`, `xml`, `ctype`, `tokenizer`, `bcmath` |
| Database | MySQL 8+, MariaDB 10.6+, or SQLite 3.35+ |
| Disk | ~150 MB plus your data |

Compiled front-end assets and the PHP `vendor/` folder are included in the download, so **Composer and Node.js are not required** to install.

---

## A. Shared hosting / cPanel

1. **Create a database.** cPanel → *MySQL® Databases* → create a database and a user, give the user *All privileges* on it. Note the names and password.
2. **Upload the files.** Upload the zip to your home folder (not inside `public_html`) and extract it, e.g. `/home/you/pharmacare`.
3. **Point the domain at `public/`.**
   - Sub-domain or add-on domain: set its *Document Root* to `/home/you/pharmacare/public`.
   - Main domain (must use `public_html`): move the **contents** of `pharmacare/public` into `public_html`, then edit `public_html/index.php` and change both `__DIR__.'/../` paths to `__DIR__.'/../pharmacare/`.
4. **Create `.env`.** In File Manager copy `.env.example` to `.env` and edit:
   ```dotenv
   APP_NAME=PharmaCare
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain.com
   APP_TIMEZONE=Asia/Dhaka

   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_DATABASE=cpaneluser_pharmacare
   DB_USERNAME=cpaneluser_dbuser
   DB_PASSWORD=your-db-password
   ```
5. **Run the installer.** cPanel → *Terminal* (or SSH):
   ```bash
   cd ~/pharmacare
   php artisan key:generate
   php artisan pharmacare:install
   php artisan optimize
   ```
   No terminal? Ask your host to run these three commands once, or use *Setup PHP App / Cron Jobs* to run them one time.
6. **Add the cron job** (cPanel → *Cron Jobs*, every minute):
   ```
   * * * * * cd /home/you/pharmacare && php artisan schedule:run >> /dev/null 2>&1
   ```
7. **Folder permissions:** `storage/` and `bootstrap/cache/` must be writable by PHP (usually 755 on cPanel).
8. Open your domain and sign in with the admin email you created.

---

## B. VPS (Ubuntu + Nginx)

```bash
sudo apt install nginx mysql-server php8.3-fpm php8.3-{mysql,mbstring,xml,curl,bcmath,zip,intl}
sudo mysql -e "CREATE DATABASE pharmacare; CREATE USER 'pharmacare'@'localhost' IDENTIFIED BY 'change-me'; GRANT ALL ON pharmacare.* TO 'pharmacare'@'localhost';"

sudo mkdir -p /var/www/pharmacare && sudo chown $USER: /var/www/pharmacare
# upload & extract the release into /var/www/pharmacare
cd /var/www/pharmacare
cp .env.example .env        # set APP_URL, APP_ENV=production, APP_DEBUG=false, DB_*
php artisan key:generate
php artisan pharmacare:install
php artisan optimize
sudo chown -R www-data: storage bootstrap/cache
```

Nginx site (`/etc/nginx/sites-available/pharmacare`):

```nginx
server {
    listen 80;
    server_name pharmacy.example.com;
    root /var/www/pharmacare/public;
    index index.php;
    client_max_body_size 12M;   # prescription photos (app limit: 10 MB)

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location ~ /\.(?!well-known) { deny all; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pharmacare /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d pharmacy.example.com      # free HTTPS
( crontab -l; echo "* * * * * cd /var/www/pharmacare && php artisan schedule:run >> /dev/null 2>&1" ) | crontab -
```

---

## C. Local computer

**Windows (Laragon/WAMP/XAMPP), macOS (Herd) or Linux:**

```bash
cp .env.example .env      # DB_CONNECTION=sqlite is the quickest — then delete the DB_HOST…DB_PASSWORD lines
php artisan key:generate
php artisan pharmacare:install
php artisan serve         # http://127.0.0.1:8000
```

For SQLite, create the empty file first: `touch database/database.sqlite` (Windows: `type nul > database\database.sqlite`).

---

## After installing

1. **Settings** → pharmacy name, address, phone, drug-licence and VAT/BIN numbers, receipt footer, VAT %, currency, printer width.
2. **Staff & Roles** → add each person with the right role:

   | Role | Can use |
   |---|---|
   | Super Admin | Everything, including staff and settings |
   | Pharmacist | POS, invoices, prescriptions, AI insights, inventory, suppliers, reports, activity log |
   | Cashier | POS, invoices, medicine guide |
   | Inventory Manager | Inventory, suppliers, reports, activity log |

3. **Inventory** → **Import from DGDA** → *Download now* to load the national medicine list (~39,000 products, ~5 minutes), then add the medicines you sell in bulk. Or from the server: `php artisan pharmacare:sync-dgda`. Then add stock (**+ Stock**) with expiry, quantity and prices — the POS shows only medicines with stock.
4. *(Optional)* **AI prescription scanning** → add a Google Gemini or OpenAI key in `.env` (`GEMINI_API_KEY` / `OPENAI_API_KEY`) or from the Prescriptions screen.

### Optional settings (`.env`)

| Key | Default | Purpose |
|---|---|---|
| `APP_TIMEZONE` | `UTC` | Your local time zone — controls what "today" means in sales and expiry counts |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | – | AI prescription scanning |
| `PHARMACARE_MEDEX_LOOKUP` | `false` | Also search medex.com.bd in the Medicine Guide (third-party site; check its terms first) |
| `PHARMACARE_DEMO_MODE` | `false` | **Public showcase only** — see [LIVE-DEMO.md](LIVE-DEMO.md) |
| `PHARMACARE_DGDA_CATALOG_URL` | DGHS terminology server | Source of the DGDA medicine catalogue (refreshed monthly by the scheduler once downloaded) |

---

## Updating

```bash
php artisan down
# back up first (see below), then upload the new files over the old ones — keep your .env and storage/
php artisan migrate --force
php artisan optimize
php artisan up
```

## Backups

Back up **the database** and **`storage/app`** (uploaded prescription images) daily.

```bash
mysqldump -u pharmacare -p pharmacare | gzip > pharmacare-$(date +%F).sql.gz
```

On cPanel, *Backup* → *Download a MySQL Database Backup* does the same.

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page / 500 error | Set `APP_DEBUG=true` temporarily and reload, or read `storage/logs/laravel.log`. Make sure `storage/` and `bootstrap/cache/` are writable. |
| "No application encryption key" | `php artisan key:generate` |
| Page looks unstyled | `APP_URL` must match the address you open (including `https://`). Delete `public/hot` if it exists. |
| Changed `.env` but nothing happened | `php artisan optimize:clear` then `php artisan optimize` |
| "Too many login attempts" | Wait one minute — sign-in is limited to 5 tries per minute per email. |
| Forgot the admin password | `php artisan tinker` → `App\Models\User::where('email','you@x.com')->first()->update(['password' => 'new-password']);` |
| Sales show under the wrong day | Set `APP_TIMEZONE` (e.g. `Asia/Dhaka`), then `php artisan optimize` |
