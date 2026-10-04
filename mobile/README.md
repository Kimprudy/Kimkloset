# Kimkloset mobile app (HNG Stage 3)

The Kimkloset store as an iPhone and Android app. It uses **the same backend and the same API endpoints as the website** (https://kimkloset.vercel.app), so one account sees the same cart and orders on both, and the cart syncs instantly between them.

Built with Expo SDK 57 (React Native, TypeScript, expo-router) and Supabase.

## Open the app (for reviewers)

| Phone | How |
|---|---|
| **Android** | Open **https://expo.dev/accounts/kimprudy/projects/kimkloset/builds/f7741c5f-03ae-4161-9ffa-ec8c0e5c2e08** on the phone and tap **Install** (or scan its QR code), or download the APK directly: https://expo.dev/artifacts/eas/TW-BKja6UPWWfBkRUaOAYJKqv1vuoOtJpMq4mk5ZnN4.apk. Allow "install unknown apps" when Android asks. |
| **iPhone (or Android), with Expo Go** | Install **Expo Go** from the App Store / Play Store, then scan the **Expo Go QR code** below with the iPhone **Camera** app (Android: scan it inside Expo Go) and tap **Open in Expo Go**. It always opens the latest version. The link inside the QR code is `exp://u.expo.dev/74584ad1-c589-41aa-8766-00d71a741730?channel-name=preview`. |

| Expo Go (iPhone / Android) | Android APK install page |
|:---:|:---:|
| <img src="docs/expo-go-qr.png" width="200" alt="QR code that opens Kimkloset in Expo Go"> | <img src="docs/android-apk-qr.png" width="200" alt="QR code for the Kimkloset Android install page"> |


Test payment (Paystack test mode): card `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`. On Paystack's test page you can also simply choose **Success**.

### What to try

1. **Same account on web and mobile.** Sign in on the website and in the app with the same email/password or Google account.
2. **Instant cart sync.** Add an item on the website: it appears in the app's Cart (and the tab badge) within a second or two, without refreshing. Change a quantity or remove an item in the app: the website cart updates by itself.
3. **Checkout on the phone.** Cart → Checkout → Pay. After paying, the cart is emptied on both, and the order shows in the app's **Orders** tab and on the website's **My orders**.

## What's in the app

- **Shop:** search, category chips, 2-column grid, "Only X left" / "Sold out" labels, pull to refresh.
- **Product:** colour and size chips, quantity stepper capped at the stock left (max 10), Add to Cart. Guests can browse; adding asks them to sign in, then adds the item they picked.
- **Cart:** plus/minus, remove, subtotal, flat ₦3,000 delivery, total. Live-synced with the website.
- **Checkout:** name, phone, address, city and a picker for the 36 states + FCT, then Paystack in a secure in-app browser sheet.
- **Orders:** every order from the website and the app, with status and details.
- **Account:** sign in / create account with email and password or Google; sign out.
- Every screen has loading, empty and error states.

## How it works

### Same endpoints as the website

The website (Next.js, in the repo root) exposes these routes. The website's own cart uses them too, and each one accepts either the website's login cookie or `Authorization: Bearer <Supabase access token>` from the app (`lib/auth.ts → getRequestUser`). Database calls run as that user, so Supabase Row Level Security still applies.

| Endpoint | What it does |
|---|---|
| `GET /api/products` | Active products |
| `GET /api/cart`, `POST /api/cart` | Read the cart; add an item (quantity capped at stock and 10) |
| `PATCH /api/cart/[id]`, `DELETE /api/cart/[id]` | Change quantity; remove |
| `GET /api/orders` | The user's orders with items |
| `POST /api/checkout` | Creates a pending order from the cart (prices re-checked on the server) and returns the Paystack link. The app sends a `returnUrl` deep link; only `kimkloset://` and `exp://` links are accepted |
| `GET /api/checkout/mobile-return` | Where Paystack sends the app's customers: confirms the payment on the server, then opens the app |
| `GET /api/orders/verify?reference=` | The app asks for the result after paying (owner only) |

### Instant sync

Supabase Realtime is enabled on `cart_items`. The website and the app both subscribe to changes on the signed-in user's rows and, on any change, refetch `GET /api/cart`. (They refetch instead of using the event data because delete events only carry the row id.)

### Sign-in

Email/password via `supabase-js`. Google uses `signInWithOAuth` with `skipBrowserRedirect`, opens the page with `WebBrowser.openAuthSessionAsync`, then `exchangeCodeForSession` (PKCE). Supabase → Authentication → URL Configuration → Redirect URLs must include `kimkloset://**` and `exp://**`.

### Security

- The app only has public values (Supabase URL, anon key, website URL). The Supabase service role key and the Paystack secret key live only on the server (Vercel).
- Prices, stock and payment status are always checked on the server, never trusted from the app.

## Run it yourself

```bash
cd mobile
npm install
cp .env.example .env   # then fill in the values (public ones only)
npx expo start
```

Scan the QR code with the iPhone Camera app (or with Expo Go on Android).

`.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
EXPO_PUBLIC_API_URL=https://kimkloset.vercel.app
```

**Google sign-in while developing:** Supabase drops `exp://` return links that use a raw IP address (Expo Go's default), and sends you to the website instead. Start Expo with a named address so it works:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=$(scutil --get LocalHostName).local npx expo start   # macOS
# or
npx expo start --tunnel
```

Checks: `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`.

## Publish

The cloud builds read the three `EXPO_PUBLIC_*` values from the EAS **preview** environment (`npx eas-cli env:list --environment preview`), because `.env` is not uploaded.

```bash
# Update for Expo Go (iPhone and Android)
npx eas-cli update --channel preview --environment preview --message "What changed"

# Android APK
npx eas-cli build -p android --profile preview
```

An iPhone install file (TestFlight) needs a paid Apple Developer account, so iPhone reviewers use Expo Go.
