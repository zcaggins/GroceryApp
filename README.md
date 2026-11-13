# LCG Delivery — Louisville Community Grocery

A mobile grocery delivery app for the Louisville Community Grocery (LCG), a community-owned cooperative grocery.

**Features**
- **Shop** — browse live inventory by category, search, see stock levels (in stock / low / out), local-item tags
- **Cart** — add/remove items (capped at available stock), subtotal, delivery fee, checkout
- **Delivery** — map of the **10-mile delivery radius** around the store; check any address or use your current location; fee tiers (0–3 mi free, 3–6 mi $2.99, 6–10 mi $4.99)
- **Get Involved** — ways to join the co-op (member-owner, volunteer, committees, donate, newsletter) with a sign-up form

**Stack:** React Native 0.88 (Expo SDK 58) · Node.js + Express · PostgreSQL · optional Kroger API example

```
lcg-delivery-app/
├── mobile/            Expo app (App.js, src/screens, src/context/CartContext.js)
└── server/            Express API (src/routes, db/schema.sql, db/seed.sql)
```

## 1. Database + API

Requires Node 18+ and PostgreSQL.

```bash
cd server
cp .env.example .env            # set DATABASE_URL and the store's real coordinates
createdb lcg
npm install
npm run db:setup                # creates tables + sample inventory
npm run dev                     # http://localhost:4000
npm test                        # radius + fee unit tests
```

### API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products?category=&search=&inStock=true` | Inventory |
| GET | `/api/products/categories` | Category list |
| GET | `/api/delivery/zone` | Store location + radius |
| POST | `/api/delivery/check` `{lat,lng}` | Is an address in range? distance + fee |
| POST | `/api/orders` | Place order (re-checks radius & stock, decrements inventory in a transaction) |
| POST | `/api/involvement` | Get Involved sign-ups |
| GET | `/api/kroger/popular?term=milk` | Optional Kroger product lookup (needs Kroger API keys) |

## 2. Mobile app

Requires **Node 22.13+** (or 24.3+) and the current **Expo Go** app, which runs SDK 58.

```bash
cd mobile
npm install
npx expo start -c
```

Set the API address (a phone can't reach `localhost` on your computer — use your LAN IP):

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). If the API isn't running, the app falls back to bundled sample inventory so you can still demo it.

## Before launch — fill these in
- **Store coordinates**: `server/.env` (`STORE_LAT`, `STORE_LNG`) and `mobile/src/config.js`. Current values are placeholders near West Broadway.
- **Radius**: `DELIVERY_RADIUS_MILES` (default 10).
- **Links**: website, ownership page and contact email are set in `mobile/src/screens/InvolvedScreen.js`; add a donation URL there to show the Donate button.
- **Inventory**: replace `server/db/seed.sql` with the real catalog.
- **Get Involved copy**: confirm wording with LCG/LACE.

## Notes
- Distance is straight-line (haversine), computed on the phone for instant feedback and re-validated on the server at checkout.
- Address lookup uses the phone's built-in geocoder via `expo-location` — no API key needed.
- No payments are taken yet; orders are recorded as `received`. Add Stripe (or pay-on-delivery / SNAP EBT handling) as a next step.
