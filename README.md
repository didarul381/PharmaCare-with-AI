# PharmaCare AI — Modern Pharmacy Management System

Laravel 13 + Inertia (React/TypeScript) pharmacy suite: FEFO-aware POS, batch & expiry inventory, AI prescription OCR, drug–drug interaction (DDI) shield, demand forecasting, P&L reports, RBAC and audit trail. Built mobile-first with a dark clinical UI.

> **Live demo:** _coming soon_

## Screenshots

| Login (1-click demo roles) | Executive dashboard |
|---|---|
| ![Login](docs/screenshots/01-login-desktop.png) | ![Dashboard](docs/screenshots/02-dashboard-desktop.png) |

| POS with FEFO batch allocation | Inventory & FEFO vault |
|---|---|
| ![POS](docs/screenshots/03-pos-desktop.png) | ![Inventory](docs/screenshots/04-inventory-desktop.png) |

| AI forecasting & DDI sandbox | Reports & P&L |
|---|---|
| ![AI Insights](docs/screenshots/05-ai-insights-desktop.png) | ![Reports](docs/screenshots/06-reports-desktop.png) |

<p align="center">
  <img src="docs/screenshots/07-dashboard-mobile.png" width="260" alt="Mobile dashboard">
  &nbsp;&nbsp;
  <img src="docs/screenshots/08-pos-mobile.png" width="260" alt="Mobile POS cart">
</p>

## Features

- **POS & dispensing** — barcode/keyword search, FEFO batch auto-pick, hold orders, discounts, VAT, split payments (Cash / Card / bKash / Nagad / Credit)
- **Inventory** — medicines, batches, expiry tracking, unit conversions (Box → Strip → Piece), stock adjustments
- **AI** — prescription image OCR, seasonal demand forecasting, restock recommendations, DDI checker
- **Finance** — invoices, due collection, returns, P&L / COGS, payment channel breakdown, CSV export
- **Compliance** — role-based access (Super Admin, Pharmacist, Cashier, Inventory Manager), immutable audit log, controlled-substance log

## Demo accounts

All passwords are `password`.

| Role | Email |
|---|---|
| Super Admin | admin@pharmacare.ai |
| Lead Pharmacist | pharmacist@pharmacare.ai |
| Senior Cashier | cashier@pharmacare.ai |
| Inventory Manager | inventory@pharmacare.ai |

## Local setup

```bash
composer install
cp .env.example .env && php artisan key:generate
# set DB_* in .env (MySQL)
php artisan migrate --seed
php artisan db:seed --class=DemoSalesSeeder   # 30 days of realistic sales for charts/reports
npm install && npm run build
php artisan serve
```

`DemoSalesSeeder` is idempotent and date-relative — re-run it any time to refresh the last 30 days of demo sales.

## License

MIT
