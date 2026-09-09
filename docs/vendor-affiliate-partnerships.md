# Vendor / Affiliate Partnerships

## Deployment

1. Apply migrations with `supabase db push` (or run
   `supabase/migrations/20260907103000_vendor_affiliate_partnerships.sql` in the
   Supabase SQL editor).
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. The click, conversion and
   payout routes use it to perform privileged writes; never expose it as a
   `VITE_` variable.
3. Create vendor rows from an authenticated admin operation and set `status` to
   `active`. Configure payout provider webhooks before moving payouts to
   `processing`.

## Commission rules

The seeded tiers use platform cuts of 15% (0–100), 12% (101–500), and 8%
(501+). The database function selects the tier and the conversion endpoint
calculates the vendor commission from the verified order total. Client supplied
commission amounts are ignored. Currency conversion is recorded with the
server-supplied exchange rate, and ledger entries are immutable audit records.

## Operations and roadmap

Conversions begin as `pending`; payment confirmation should call
`POST /api/affiliate-conversion` with an idempotency key. Refund webhooks should
create a negative `clawback` ledger entry and mark the sale `reversed`.
Fraud review should inspect `fraud_flags` (self-referrals, duplicate visitors,
and abnormal conversion rates) before approving ledger entries. A scheduled
job can then batch `available` ledger balances into `payouts`.

Future hardening: integrate a trusted FX provider, add signed webhook
verification for each payment provider, add KYC/tax forms, and expose admin
screens for tier/vendor moderation and payout reconciliation.
