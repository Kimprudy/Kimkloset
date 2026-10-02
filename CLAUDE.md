# Kimkloset — project guide for Claude Code

## What this is
Kimkloset (one word, never "Kim Closet") is a women's fashion store in Lagos, Nigeria.
Instagram: @kimklosetng. Owner of this repo: Okim Glory (HNG Internship 15, AI engineer track).

- **Stage 2 (done):** e-commerce website. Live at https://kimkloset.vercel.app
- **Stage 3 (now):** a mobile app that uses the same backend as the website (see "Stage 3 task" below)

## How to work 
- Go step by step and keep it beginner-friendly. Say what you're about to do before doing it.
- Give exact commands and exact SQL to paste. Don't paraphrase them.
- Before you run SQL that changes the live Supabase database, show it and wait for a yes.
- Never commit `.env.local` or any key. The `SUPABASE_SERVICE_ROLE_KEY` must never go into the mobile app.
- When something fails, fix that one thing. Don't rewrite working parts.
- Check the web build (`npm run build`) passes before every push. Pushing to `main` redeploys Vercel.

## Web app (this repo root)
- Next.js 15 (App Router) + TypeScript + Tailwind, deployed on Vercel.
- Supabase handles auth (email/password and Google OAuth) and the Postgres database with RLS.
- Paystack (test mode, NGN) for payment. Mailgun (sandbox) for the order confirmation email.
- Brand: pink `#F86EDE` (darker `#E04BC4` / `#B8339F`), ink `#111111`, white. Fonts: Cormorant Garamond for display, DM Sans for body.

### Key files
- `lib/supabase/{client,server,admin,middleware}.ts`: Supabase clients. `admin` uses the service role and is server-only.
- `components/CartProvider.tsx`: the web cart. A guest cart lives in localStorage and merges into `cart_items` on sign-in.
- `app/api/checkout/route.ts`: recalculates prices from the database, checks stock, creates a `pending` order, then initialises Paystack.
- `lib/orders.ts` → `finalizeOrder(reference)`: verifies with Paystack, marks the order paid, reduces stock (RPC `decrement_stock_for_order`), clears the cart and sends the email once. Safe to call more than once.
- `app/api/paystack/webhook/route.ts`: backup confirmation, with the HMAC signature checked.
- `supabase/*.sql`: schema, RLS, seed and stock migration. Run in order 01, 02, 04.

### Database (Supabase, RLS on every table)
- `profiles(id, full_name, email, phone, avatar_url)`: users can read and update their own row.
- `products(id, slug, name, description, price, category, sizes[], colors[], image_url, is_active, stock)`: anyone can read active products. Prices are whole Naira.
- `cart_items(id, user_id, product_id, size, color, quantity)`, unique on `(user_id, product_id, size, color)`: users have full access to their own rows only.
- `orders(..., status pending|paid|failed|cancelled, payment_reference, totals, customer + address fields, paid_at, email_sent_at)`: users can read their own. Only the server writes.
- `order_items(...)`: users can read items belonging to their own orders.
- Image URLs are relative (`/products/x.jpg`). On mobile, prefix them with `https://kimkloset.vercel.app`.

Before starting, check the live state: is the `stock` column there? Was `04_stock_and_new_products.sql` run? Ask Edozie if you're unsure.

## Stage 3 task: mobile app
Requirements from HNG:
1. A mobile app for the shop that **consumes the same endpoints** as the website.
2. The same account can log in on web and mobile and **sees the same data**: cart and orders.
3. Adding to the cart on the web **shows up instantly** in the mobile cart, and the other way round.
4. Test it on a real phone. Deploy it so reviewers can install or open it.

### Plan
**Location:** put the app in `mobile/` inside this repo, so there's one GitHub link to submit. Add `"mobile"` to `exclude` in the root `tsconfig.json` so the Vercel build ignores it.

**Mobile stack:** Expo (React Native, TypeScript, expo-router), tested in **Expo Go** on Edozie's phone. Use these packages:
- `@supabase/supabase-js` with `@react-native-async-storage/async-storage`, `react-native-url-polyfill` and `flowType: 'pkce'`
- `expo-web-browser`, `expo-linking`
- `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/dm-sans`

**Shared API ("same endpoints").** Add these to the web app and make both web and mobile use them. Each one accepts **either** the web's auth cookie **or** `Authorization: Bearer <supabase access_token>`. Make one helper, e.g. `lib/auth.ts → getRequestUser(request)`, that checks the Bearer token first and falls back to cookies. Run the database calls as that user, so RLS still applies.

| Endpoint | What it does |
|---|---|
| `GET /api/products` | list active products |
| `GET /api/cart` | list the user's cart |
| `POST /api/cart` | add an item (caps quantity at stock and MAX_QTY) |
| `PATCH /api/cart/[id]` | change quantity |
| `DELETE /api/cart/[id]` | remove an item |
| `GET /api/orders` | the user's orders with their items |
| `POST /api/checkout` | already exists; add Bearer support plus an optional `returnUrl` for mobile |
| `GET /api/orders/verify?reference=` | calls `finalizeOrder` and returns the status; only the order's owner can see the result |

Once these work, consider switching the web `CartProvider` to `/api/cart` too, so web and mobile hit literally the same endpoints.

**Instant sync.** Use Supabase Realtime on `cart_items`:
1. Enable it: `alter publication supabase_realtime add table public.cart_items;` (show this to Edozie first).
2. On web (`CartProvider`) and on mobile, subscribe to `postgres_changes` on `cart_items` for the signed-in user. On **any** event, refetch the cart. Don't build state from the event payload, because delete events carry only the primary key.

**Mobile auth:**
- Email/password through supabase-js works the same as on web.
- Google sign-in: call `signInWithOAuth({ provider: 'google', options: { redirectTo: Linking.createURL('auth/callback'), skipBrowserRedirect: true } })`. Then call `WebBrowser.openAuthSessionAsync(url, redirectTo)` and finally `exchangeCodeForSession(code)`.
- Add `kimkloset://**` and `exp://**` to Supabase → Authentication → URL Configuration → Redirect URLs.

**Mobile checkout:**
1. The app calls `POST /api/checkout` with the delivery details and `returnUrl = Linking.createURL('checkout/return')`.
2. The server must only accept a `returnUrl` that starts with `kimkloset://` or `exp://`, to prevent open redirects.
3. When `returnUrl` is set, make Paystack's `callback_url` a new web page, `/checkout/mobile-return?reference=…&to=…`. That page runs `finalizeOrder` and then redirects to the app deep link.
4. The app opens the Paystack link with `WebBrowser.openAuthSessionAsync`. When control comes back, it calls `/api/orders/verify` and shows the confirmation.
5. The existing web success page needs a cookie session, so don't use it for mobile.

**Screens:**
- Shop: category chips, search, a 2-column grid, and "Only X left" / "Sold out" labels.
- Product: size and colour chips, a quantity stepper capped at stock, Add to Cart.
- Cart: plus/minus, remove, totals including the ₦3,000 flat delivery fee.
- Checkout: name, phone, address, city and state picker (36 states + FCT).
- Orders.
- Sign in / sign up.
- Every screen needs loading, empty and error states.

**Testing:**
1. Run `cd mobile && npx expo start` and scan the QR code with Expo Go. Use `--tunnel` if the phone and laptop aren't on the same Wi-Fi.
2. Sign in on web, add an item, then open the app with the same account: the item must be there.
3. Add an item in the app: the web cart must update without a refresh.
4. Pay with Paystack test card `4084 0840 8408 4081`, CVV `408`, PIN `0000`, OTP `123456`. The order should then appear on both web and mobile.

**Deployment:**
- **Android:** EAS Build gives a shareable APK link: `npx eas build -p android --profile preview` (needs a free Expo account).
- **iPhone:** reviewers open the app in Expo Go via `npx eas update`. TestFlight needs a paid Apple developer account.
- Add a `mobile/README.md` with setup steps, the env vars and the install link.

**Mobile env (public values only):** `mobile/.env` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and `EXPO_PUBLIC_API_URL=https://kimkloset.vercel.app`. Add `mobile/.env` to `.gitignore`.