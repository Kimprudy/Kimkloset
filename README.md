# Kimkloset — Online Fashion Store

A complete e-commerce site for **Kimkloset**, a women's fashion store in Nigeria (Instagram [@kimklosetng](https://www.instagram.com/kimklosetng)).

Visitor → Browse → Add to cart → Sign in (email or Google) → Cart saved to account → Checkout → Pay with Paystack → Order saved in Supabase → Confirmation email via Mailgun → Order confirmation page → "My orders".

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | **Next.js 15 (App Router) + TypeScript** | One project for pages and secure server routes. Deploys to Vercel in one click. |
| Styling | **Tailwind CSS** | Fast to build a polished, fully responsive UI. |
| Auth + database | **Supabase** (Postgres, Auth, Row Level Security) | Email/password and Google sign-in built in. RLS keeps each user's cart and orders private. |
| Google sign-in | **Google OAuth** via Google Cloud Console → Supabase | |
| Payments | **Paystack** | See below. |
| Email | **Mailgun HTTP API** | Called directly with `fetch`, no extra package. |
| Hosting | **Vercel** | Free tier, environment variables in the dashboard. |

## 2. Payment provider: Paystack

**Paystack is the fastest reliable option for this store:**

- The store sells in **Naira**, and Paystack is built for Nigerian cards, bank transfer and USSD.
- **Test keys are available immediately** after sign-up, with no business verification needed for test mode.
- The integration is **two server calls**: `initialize` (get a payment link) and `verify` (confirm the payment). No SDK or frontend script is needed.
- Stripe does not onboard Nigerian businesses directly. Flutterwave works but has a heavier dashboard and onboarding.

The secret key is only used on the server (`/api/checkout`, `lib/paystack.ts`). The browser never sees it and never decides whether an order is paid.

## 3. Database schema (Supabase)

```
auth.users (Supabase managed)
   │ 1
   ├──── 1 profiles        id (= user id), full_name, email, phone, avatar_url
   ├──── * cart_items      id, user_id, product_id → products, size, color, quantity
   └──── * orders          id, order_number, user_id, status (pending|paid|failed|cancelled),
                            payment_reference, subtotal, shipping_fee, total, currency,
                            customer_name/email/phone, shipping_address, city, state,
                            paid_at, email_sent_at, created_at
                              │ 1
                              └── * order_items  id, order_id, product_id, product_name, product_image,
                                                 size, color, unit_price, quantity, line_total
products   id, slug, name, description, price (₦), category, sizes[], colors[], image_url, is_active
```

**Row Level Security**

- `products`: anyone can read active products.
- `profiles`, `cart_items`: a user can only read and change **their own** rows.
- `orders`, `order_items`: a user can only **read** their own. Only the server (service role key) can create orders or mark them paid, so nobody can mark their own order as paid from the browser.

The full SQL is in `supabase/01_schema.sql`. The 8 products are in `supabase/02_seed_products.sql`.

## 4. Folder structure

```
kimkloset/
├── app/
│   ├── layout.tsx               # Header, footer, cart provider, toasts
│   ├── page.tsx                 # Homepage: hero + catalog (categories + search)
│   ├── products/[slug]/         # Product detail page
│   ├── cart/page.tsx            # Cart: quantity +/−, remove, totals
│   ├── login/page.tsx           # Sign in / sign up / Google
│   ├── auth/callback/route.ts   # Google sign-in lands here
│   ├── checkout/page.tsx        # Review cart + delivery details (signed-in only)
│   ├── checkout/success/        # Verifies payment, shows confirmation
│   ├── orders/page.tsx          # Order history (signed-in only)
│   └── api/
│       ├── checkout/route.ts            # Creates order + Paystack payment link
│       └── paystack/webhook/route.ts    # Backup payment confirmation from Paystack
├── components/                  # CartProvider, ProductCard, Catalog, CheckoutForm, LoginForm…
├── lib/
│   ├── supabase/                # browser, server, admin (service role) and middleware clients
│   ├── paystack.ts              # initialize, verify, webhook signature check
│   ├── mailgun.ts               # send email
│   ├── email-template.ts        # confirmation email HTML
│   ├── orders.ts                # finalizeOrder(): mark paid → clear cart → send email (once)
│   └── config.ts                # delivery fee, categories, Nigerian states
├── middleware.ts                # Keeps login fresh, protects /checkout and /orders
├── public/products/             # Product photos
├── public/brand/                # Logo and wordmark
└── supabase/                    # SQL to paste into Supabase
```

## 5. Implementation plan

1. Product catalog: products table, homepage grid, categories, search, product page.
2. Authentication: Supabase email/password plus Google OAuth, and a callback route.
3. Cart: guests' carts stay in the browser. After sign-in they are merged into `cart_items`, and the cart persists across sessions and devices.
4. Checkout: review items, collect name, phone and address, then show the total.
5. Payment: the server recalculates prices from the database, saves a `pending` order and redirects to Paystack. On return, the server verifies with Paystack and marks the order `paid`. A webhook is a backup.
6. Order persistence: order and order items are saved, the cart is emptied, and the "My orders" page shows the history.
7. Mailgun: the confirmation email is sent exactly once per paid order.
8. Polish: loading skeletons, empty states, error messages, toasts, and a mobile-first layout.

---

## 6. Run it on your laptop

### A. Supabase database

1. Supabase → your project → **SQL Editor** → **New query**.
2. Paste all of `supabase/01_schema.sql` → **Run**.
3. New query → paste all of `supabase/02_seed_products.sql` → **Run**.
   Then do the same with `supabase/04_stock_and_new_products.sql` (stock tracking + more products).
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (change it to your Vercel URL after deploying).
   - Redirect URLs → add `http://localhost:3000/**`.
5. Optional, for faster testing: **Authentication → Sign In / Providers → Email** → turn off "Confirm email". This skips the confirmation link on sign-up.

### B. Environment variables

1. In the project folder, copy `.env.example` and rename the copy to **`.env.local`**.
2. Fill in each value:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key (newer dashboards: **publishable** key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (newer: **secret** key). Keep private. |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys & Webhooks → **Test Secret Key** (`sk_test_…`) |
| `MAILGUN_API_KEY` | Mailgun → API Keys (private key) |
| `MAILGUN_DOMAIN` | Mailgun → Sending → Domains → your sandbox domain (`sandbox….mailgun.org`) |
| `MAILGUN_FROM` | `Kimkloset <postmaster@YOUR_SANDBOX_DOMAIN>` |
| `MAILGUN_API_BASE` | `https://api.mailgun.net` (or `https://api.eu.mailgun.net` if your account is in the EU region) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

The Google Client ID and Secret are **not** in this file. They live in Supabase (Authentication → Providers → Google), which you've already set up.

> **Mailgun sandbox:** it only delivers to addresses listed under **Authorized Recipients**. Add every email you'll test checkout with and click the confirmation link Mailgun sends.

### C. Start it

```bash
npm install
npm run dev
```

Open http://localhost:3000

### D. Test payment (Paystack test mode)

- Card: `4084 0840 8408 4081`
- Expiry: any future date · CVV: `408`
- PIN: `0000` · OTP: `123456`

---

## 7. Deploy to Vercel

1. Push the project to a GitHub repo. `.env.local` is ignored and will not be uploaded.
2. Vercel → **Add New Project** → import the repo → Framework: Next.js.
3. **Environment Variables**: add every variable from your `.env.local`, but set `NEXT_PUBLIC_SITE_URL` to `https://YOUR-APP.vercel.app`.
4. Deploy. Then:
   - **Supabase → Authentication → URL Configuration**: set Site URL to your Vercel URL and add `https://YOUR-APP.vercel.app/**` to Redirect URLs.
   - **Google Cloud → your OAuth client**: add `https://YOUR-APP.vercel.app` under Authorized JavaScript origins. The redirect URI stays the Supabase one.
   - **Paystack → Settings → API Keys & Webhooks**: set the Test Webhook URL to `https://YOUR-APP.vercel.app/api/paystack/webhook`.

## 8. Security checklist

- All secrets are in environment variables. Only `NEXT_PUBLIC_*` values reach the browser, and those are safe to expose.
- `lib/supabase/admin.ts` imports `server-only`, so the build fails if the service key is ever pulled into browser code.
- Prices are recalculated on the server from the database, so the browser can't change what you pay.
- Every payment is verified with Paystack on the server, including the amount and currency, before an order becomes `paid`.
- The webhook checks Paystack's HMAC-SHA512 signature.
- RLS ensures users can never read another user's cart or orders.

---

## 9. Adding new clothes

**Easiest (no code, no redeploy):**

1. Supabase → **Storage** → **New bucket** → name it `products` → switch **Public bucket** on → Create.
2. Open the bucket → **Upload file** → choose the photo (portrait, well lit, ironed).
3. Click the uploaded photo → **Get URL** / **Copy URL**.
4. Supabase → **Table Editor** → `products` → **Insert row**:
   - `slug`: lowercase words joined by dashes, e.g. `red-satin-cowl-dress` (must be unique)
   - `name`, `description`
   - `price`: plain number, e.g. `30000`
   - `category`: `Dresses`, `Tops`, `Outerwear` or `Shapewear` (a new word adds a new tab automatically)
   - `sizes`: `{XS,S,M,L,XL}` · `colors`: `{Red}`
   - `image_url`: paste the URL from step 3
5. Save and refresh the site. The item appears immediately.

**Using SQL instead:** copy `supabase/03_add_product_template.sql`, change the values and run it.

**To remove an item**, set `is_active` to `false`. This keeps old orders intact.

---

## 10. Stock

Every product has a **stock** number (Table Editor → `products` → `stock`).

- When an order is **paid**, stock goes down automatically. For example, 50 white gowns minus 2 sold leaves 48.
- At 5 or fewer, the site shows **"Only X left"**. At 0 it shows **Sold out** and the Add to Cart button is disabled.
- Checkout refuses to take payment if someone's cart has more than you have left.
- To restock, type the new number in the `stock` cell.

Stock is counted per product, not per size.
