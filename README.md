# Open & Edit Pages

قم بفتح ملفات هذا الموقع لاستطيع التعديل عليها

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0ebec692-3812-4a78-af6c-ffa6288f3460).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Production integrations

Copy `.env.example` to the deployment environment. Payment credentials are
server-only and are never read by client code. Checkout displays each provider
as unavailable until its required variables are configured; the manual option
only records a pending order and does not claim that payment succeeded.

Run the Supabase migrations before enabling downloads. Digital files belong in
the private `digital-files` bucket and are served only through five-minute
signed URLs after the purchaser (or configured admin) is authorized. Configure
an optional `ORDER_NOTIFICATION_WEBHOOK_URL` in your own server worker for
email/notification delivery after provider webhooks mark an order paid.

The MVP includes `/membership`, `/affiliate`, `/learning`, and `/content` routes.
The Supabase platform migration adds plans/entitlements, referrals and commissions,
cart/refund events, course progress/quizzes/certificates/discussions, editable content,
loyalty, automation, audit and backup records. OAuth, 2FA, email, monitoring, backups,
and payment credentials remain server-side setup-required integrations.
