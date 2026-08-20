# Lion Gold Shipping & Storage

A complete Next.js 16 and Supabase rebuild of the Lion Gold public freight site and administration console. The application includes responsive shipment tracking, private cargo images, customer enquiries, Supabase Auth, shipment/event/message management, invoices, an activity log, metadata, and legacy URL redirects.

The original PHP application is preserved in `legacy-php/` for reference. It is not imported or served by the Next.js application.

## Stack

- Next.js App Router, React, TypeScript, and Server Actions
- Supabase Postgres, Auth, Row Level Security, Storage, and RPCs
- Zod validation and Lucide SVG icons
- Responsive CSS with desktop, tablet, compact mobile, reduced-motion, print, and accessible focus states

## Local setup

Requirements: Node.js 20.9 or newer, npm, and a Supabase project.

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy the environment template and replace every placeholder:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Apply `supabase/migrations/202608200001_initial_schema.sql` to the Supabase project. You can paste the complete file into the Supabase SQL Editor, or link the Supabase CLI project and run `supabase db push`.

4. In Supabase Authentication settings, disable public user sign-up. Create or invite administrators from the Supabase dashboard only. The application intentionally has no public registration route.

5. Create or invite the first user in Supabase Authentication, then activate that existing user as the first administrator:

   ```powershell
   npm run admin:bootstrap -- admin@example.com "Admin Name"
   ```

   The command reads `.env.local`, requires the server-only Supabase secret, and never creates a default password. It is also the recovery procedure if all administrator profiles are accidentally inactive.

6. Start development:

   ```powershell
   npm run dev
   ```

   Open `http://localhost:3000`. Admin sign-in is at `http://localhost:3000/admin/login`.

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical application origin used by metadata and the sitemap |
| `NEXT_PUBLIC_APP_CURRENCY` | Public | Default three-letter display currency |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Browser-safe Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Server only | Trusted RPCs, cargo-image signing, and bootstrap administration |

Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names are also supported. Never expose either server secret through a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Redesigned public landing page, tracking form, and enquiry form |
| `/track?number=...` | Privacy-safe shipment result and event timeline |
| `/admin/login` | Supabase administrator sign-in |
| `/admin` | Dashboard |
| `/admin/shipments` | Shipment search and management |
| `/admin/statuses` | Reusable status catalog |
| `/admin/contacts` | Customer enquiry inbox |
| `/admin/activity` | Immutable administrative audit trail |
| `/api/health` | No-cache service/configuration health response |

Old PHP URLs such as `/index.html`, `/order-details.php?trackingcode=...`, and the former `/newadmin/*.php` pages redirect to their current equivalents.

## Security model

- Public visitors receive no direct table access and cannot call the tracking or contact RPCs with the browser key. Next.js invokes narrowly scoped server-only RPCs.
- Public tracking returns masked names and no address, phone, email, or internal notes. Billing values appear only when an administrator enables billing visibility.
- Cargo files are limited to validated JPEG, PNG, or WebP images, stored in a private bucket, and displayed through short-lived signed URLs.
- Every admin mutation checks the authenticated user against an active `admin_profiles` row. Database RLS provides the second authorization boundary.
- New tracking references contain a full random UUID. Older 4–64 character references remain readable for compatibility.
- Production deployments should also add edge/WAF rate limits and CAPTCHA or equivalent abuse protection to public tracking and enquiry requests.

Keep public Supabase sign-up disabled. Supabase project secrets and SMTP/API credentials belong in deployment environment settings, never in source control.

## Verification

Run the complete local verification set before deployment:

```powershell
npm run typecheck
npm run lint
npm run build
```

Then verify:

1. `/`, `/track`, invalid tracking, and unavailable-service states at 320 px, 390 px, tablet, and desktop widths.
2. Administrator sign-in/sign-out and inactive-user rejection.
3. Shipment creation, editing, deletion, private image upload/removal, and invoice print layout.
4. Event status synchronization and shipment messages.
5. Contact submission, read/unread state, reply link, and deletion.
6. An anonymous Supabase client cannot read tables, invoke public RPCs directly, or access stored cargo objects.

## Deployment

Deploy as a standard Next.js application and set all variables from `.env.example` in the host. `NEXT_PUBLIC_SITE_URL` must be the final HTTPS origin and the Supabase URL must be available during the build so the private-image optimizer allow-list is generated correctly. Apply database migrations before routing production traffic.

For Supabase setup details, see the official [server-side Auth guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and [Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security).
