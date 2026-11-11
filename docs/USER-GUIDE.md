# User guide

Short, task-based instructions for pharmacy staff. Each section says which roles can do it.

## Getting around

- **Menu** — left sidebar on computers; ☰ button on phones. You only see the sections your role can use.
- **Search** — the box at the top (or **Ctrl + K**) searches medicines by brand, generic or barcode.
- **New sale** — green button top-right, or press **F2** from any screen.
- **Theme** — the ☀/☾ button switches Light → Dark → System. Your choice is remembered on that device.
- **Messages** — confirmations and errors appear bottom-right and disappear on their own.

## Sell medicines (Point of Sale)
*Cashier, Pharmacist, Super Admin*

1. Open **Point of Sale** (F2).
2. Scan a barcode or type a name / generic. Click a medicine card to add it. On a phone, use the **Catalog** and **Cart** tabs.
3. Change quantities with **−** / **+**. The batch closest to expiry is chosen automatically (shown as "FEFO: batch number").
4. Optional: choose a saved customer (needed for credit), add a **Discount**, or change **VAT** for this sale.
5. If two medicines in the cart interact, a warning appears — read it before continuing.
6. Choose the payment type, enter the amount received and press **Validate & Dispense** (F8). The change due is calculated for you.
7. Print or close the receipt.

**Hold a sale** (customer stepped away): **Hold** (F9). Bring it back from **Held Orders**.

## Returns, reprints and dues
*Cashier, Pharmacist, Super Admin* → **Invoices & Returns**

- Find a sale by invoice number, customer name/phone or cashier; filter by status, payment type or date.
- **Invoice** → reprint as A4, 80 mm or 58 mm.
- **Collect due** (amber button) → record a payment against an unpaid or partial invoice.
- **Return** (↺) → choose items and quantities; stock goes back into the original batch.

## Add medicines and stock
*Inventory Manager, Pharmacist, Super Admin* → **Inventory**

1. **Add Medicine** — name, SKU, generic, category, manufacturer, dosage form, strength, reorder level. Tick *Prescription required* or *Controlled* when relevant. Missing generic/category? Use **+ Add New** beside the field.
2. **Add Batch** — pick the medicine, enter batch number, expiry date, quantity, cost and selling price. The medicine now appears in the POS.
3. **Adjust** — fix counts for damage, expiry, or stock-take differences. Every adjustment needs a reason and is logged.
4. Use the **Expiry** filter to see what expires soon; the dashboard also lists batches expiring within 30 days.

## Suppliers and purchases
*Inventory Manager, Pharmacist, Super Admin* → **Suppliers & Purchases**

Create a purchase order for a supplier, then **Receive** it when the goods arrive — batches and stock are created from the receipt.

## Prescriptions
*Pharmacist, Super Admin* → **Prescriptions**

Upload a photo of a prescription. The doctor, patient and medicines are read by AI and matched to your stock; review the matches, then send them to the POS cart in one click. This needs a Google Gemini (free tier available) or OpenAI key — add it in `.env` or from the key banner on this screen. Two built-in sample prescriptions let you try it without a key.

## Reports
*Pharmacist, Inventory Manager, Super Admin* → **Reports**

Pick a period (Today … This Year or a custom range) and a tab:

- **Profit & Loss** — revenue, cost of goods, gross profit and margin, payment channels, best sellers
- **Sales & Staff** — totals per staff member
- **Stock Value** — cost and retail value of what is on the shelf
- **Controlled Drugs** — every controlled-drug sale with patient and prescriber
- **Customer Dues** — who owes what

Use **Export** for CSV or **Print** for a paper copy.

## Staff accounts
*Super Admin* → **Staff & Roles**

Add staff with a name, email, password and role. **Deactivate** signs the person out immediately and blocks future sign-ins (their past sales stay intact). Staff change their own password under **My profile & password** in the user menu.

## Settings
*Super Admin* → **Settings**

Pharmacy name and contact details, drug-licence and VAT/BIN text exactly as you want them printed, receipt footer, default VAT %, currency symbol and printer width. The receipt preview updates as you type; **Test Print** sends a sample to your printer.

## Activity log
*Pharmacist, Inventory Manager, Super Admin* → **Activity Log**

A read-only record of sign-ins, stock adjustments, deletions, role changes and controlled-drug sales — with who, when and from which device.
