# Changelog

## 1.0.0 — 2026-11-12

First commercial release.

### Added
- DGDA national medicine catalogue (~39,000 registered products from the DGHS terminology server): one-time download with progress bar or `php artisan pharmacare:sync-dgda`, monthly auto-refresh, search/filter by company and form, bulk “add to inventory” with duplicate protection, and **+ Stock** shortcuts for new medicines.
- Inventory pagination (medicines and batches) and a Stock filter (in stock / no stock).
- Light, dark and system themes with a toggle in the header, sign-in page and user menu; preference remembered per device.
- `php artisan pharmacare:install` — guided installer (clean pharmacy or demo data, first admin, store name).
- Demo mode (`PHARMACARE_DEMO_MODE`) with one-click role sign-in, role switcher, blocked destructive actions and scheduled `pharmacare:demo-reset`.
- Working global medicine search (Ctrl + K) and F2 shortcut to the POS from any screen.
- Themed notifications and confirmation dialogs (replace browser pop-ups).
- Friendly error pages (403, 404, 500, 503) and session-expired handling.
- Mobile card layouts for medicines and batches; invoice pagination.
- Login rate limiting (5 attempts per minute) and sign-out of deactivated staff.
- Configurable time zone (`APP_TIMEZONE`).
- Release packaging script (`npm run release`).
- Access-control, demo-mode and sales-ledger feature tests.

### Changed
- Every page now requires sign-in; role permissions are enforced on the server, not only hidden in the menu.
- Plain-language page titles, navigation grouped into Sell / Stock / Insights / Admin.
- Larger minimum text size and touch targets; visible keyboard focus; skip-to-content link.
- Dashboard shows real "vs yesterday" change and real 7-day revenue.
- Fresh installs start with neutral store details instead of sample ones.
- Staff without a photo get initials instead of a stock photo.
- Medicine Guide's medex.com.bd lookup is now opt-in (`PHARMACARE_MEDEX_LOOKUP`).

### Fixed
- Stock figures ran one database query per medicine on list screens; low-stock counts loaded every medicine — now computed in SQL / from preloaded data. Medicines never stocked are no longer counted as “low stock” or flagged by restock forecasts.
- POS listed medicines with no stock; it now shows only sellable stock.
- Medicine Guide “#” (names starting with a digit) used SQLite-only syntax and failed on MySQL; the list is capped at 300 with a count of total matches.
- Any visitor was treated as Super Admin without signing in.
- Any account could be opened with the password `password`.
- Invoices and the controlled-drug report crashed when a sale was linked to a prescription.
- Store address, phone, email, licence and VAT numbers were missing from printed A4/thermal invoices.
- A 0 % VAT setting reverted to 5 % in Settings and at the POS.
- Dashboard chart showed random revenue on days without sales.
- Fake figures removed (fixed "+14.2%" trend, "94.8% accuracy", "FDA/DGDA Compliant" badge).
- AI keys could inject extra lines into `.env`; tests no longer write to `.env`.
- Security updates for Symfony and CommonMark dependencies; unused Tailwind Typography plugin removed.
