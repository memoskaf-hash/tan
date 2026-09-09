# Production launch checklist

- Copy `.env.example` to the deployment secret store. Never expose service-role or payment keys as `VITE_*`.
- Run `supabase link --project-ref <ref>` then `supabase db push` and verify the private `digital-files` bucket.
- Assign `app_metadata.role=admin` only through a trusted Supabase server/admin workflow; do not edit JWT claims in the browser.
- Configure provider webhooks to `/api/payment-webhooks?provider=stripe|paypal|moyasar`. Stripe and Moyasar require webhook secrets. PayPal fulfillment remains disabled until its verify-webhook-signature API is wired.
- Configure `EMAIL_AUTOMATION_WEBHOOK_URL` for receipt, refund, and abandoned-cart processing. The app records events but does not send email without this credential.
- Configure `ERROR_MONITORING_DSN` in the hosting runtime if the monitoring adapter is enabled.
- Use production PayPal API URL, HTTPS redirect URLs, domain/auth redirect allowlists, backups, rate limiting, and a final test purchase before launch.

External services are not live until their credentials, webhooks, Supabase deployment, storage policy, and provider-side settings are verified.
