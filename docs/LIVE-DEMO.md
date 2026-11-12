# Hosting a public live demo

Demo mode turns an installation into a safe showcase for prospective customers.

**What changes in demo mode**

- The sign-in page shows one-click buttons for all four roles.
- Signed-in visitors can switch role from their profile menu.
- Sensitive actions are blocked with a friendly message: adding/editing/deactivating staff, changing settings, saving AI keys, editing profiles, deleting medicines, prescriptions or interaction rules.
- Everything else (sales, returns, stock, purchases) works normally — and the data is wiped and re-seeded on a schedule.

> Never enable demo mode on a real pharmacy: every demo account uses the password `password`.

## Setup

1. Install on a separate sub-domain (e.g. `demo.your-domain.com`) with its **own database** — follow [INSTALLATION.md](INSTALLATION.md) and choose **Demo data** in the installer (or run `php artisan pharmacare:install --demo`).
2. In `.env`:
   ```dotenv
   PHARMACARE_DEMO_MODE=true
   PHARMACARE_DEMO_RESET_CRON="0 */6 * * *"   # every 6 hours; any cron expression
   APP_DEBUG=false
   ```
3. `php artisan optimize`
4. Load the medicine catalogue once: `php artisan pharmacare:sync-dgda` (the in-app download button is disabled in demo mode). Demo resets keep it.
5. Make sure the scheduler cron job is installed (see INSTALLATION.md). It runs `php artisan pharmacare:demo-reset`, which rebuilds the database with fresh sample staff, medicines and 30 days of sales ending today.

Reset manually at any time:

```bash
php artisan pharmacare:demo-reset
```

The command refuses to run unless demo mode is on (or you pass `--force`), so it cannot wipe a real pharmacy by accident.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@pharmacare.ai | password |
| Pharmacist | pharmacist@pharmacare.ai | password |
| Cashier | cashier@pharmacare.ai | password |
| Inventory Manager | inventory@pharmacare.ai | password |
