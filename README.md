# ApnaKart frontend

Customer storefront and admin workspace built with Next.js 14 App Router, TypeScript, Tailwind CSS and Zustand. It consumes the APIs in the sibling `ecommerce-backend` project.

## Customer experience

- Responsive header, category mega menu and accessible mobile navigation drawer
- Home banners, premium category/subcategory cards, eight-item product shelves and recently viewed products
- Product search with backend brand/color filters, price range, sort and cursor pagination
- Product gallery, stock state, discount pricing and cart actions
- Server-backed cart with quantity and savings summary
- Address selection, Google Pay/PhonePe through Razorpay, cards, netbanking and cash on delivery
- Phone-number login/sign-up with six-digit OTP, paste support and resend timer
- Order history, payment state, fulfilment state and cancellation
- Profile and saved-address management
- Light/dark theme, skeleton states, retry states and toast feedback
- Debounced search suggestions in the header
- SEO: server-rendered pages, ISR caching, sitemap, robots, product JSON-LD and canonical links

## Admin workspace

- Separate responsive admin shell and overview
- Product create/edit, visibility control and bulk upload
- Order fulfilment and refund-warning states
- Category tree, brands, banners and customer access management
- Super-admin-only role management exposed only when the signed-in role allows it

## Structure

```text
src/
  app/                 # Next.js routes, route boundaries, sitemap and robots
  api/                 # One file per backend module + the http fetch wrapper
  components/
    layout/            # Customer shell, header, drawer, footer and providers
    ui/                # Feedback, loading and small shared presentation
  features/
    account/           # Profile and delivery addresses
    admin/             # Admin shell and management screens
    auth/              # Phone + OTP authentication
    cart/              # Shopping cart
    catalog/           # Home, listing, product card/gallery/actions
    checkout/          # Checkout and payment flow
    orders/            # Customer order history
  hooks/               # Shared client behavior
  lib/                 # Types, formatting, site URL and Razorpay popup
  store/               # Global auth, cart badge and toast state
```

Frontend structure, coding style and feature flows are documented in
`AGENTS.md`. Repository-wide boundaries are documented in `../AGENTS.md`.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the backend and public site URLs.
3. Start the backend, then run `npm run dev` here.

The storefront still renders its navigation, fallback categories and loading
states when the backend is unavailable. Product images appear only when the API
returns a valid image URL.

All backend calls live in `src/api/` (one file per backend module); the fetch
wrapper is `src/api/http.ts`. Redis remains a
backend concern; the frontend only sends search and filter values to the API.

Before a handoff, run `npm run lint`, `npm run typecheck` and `npm run build`.
