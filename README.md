# ApnaKart Frontend

Online shopping website made with Next.js. It works with the ApnaKart backend API.

## Features

- Home page with an auto-sliding carousel, categories and Trending / Top discounts / New arrivals rows
- Category and search pages with price, rating and sort filters (filters stay in the URL). Search understands Hindi/Hinglish and spelling mistakes, and shows results by relevance
- SEO: home, category and product pages are rendered on the server with their own title, description and canonical link; product pages add Product data for Google; search result pages are not indexed and load their results in the browser; sitemap and robots are generated
- Product page with image gallery, colour / size, quantity, details table, rating bars, reviews and related products
- Cart, Buy now and checkout in steps: address, then payment (Cash on Delivery, or UPI / cards / net banking in the Razorpay window)
- Payment pending page with countdown and Pay now, and an order confirmed page
- Login with mobile number and OTP (2-minute timer, resend after 60 seconds)
- My orders and order details: tracking, cancel, pay now, buy again
- My account and saved addresses (up to 5)
- Admin panel: dashboard, orders (items and address, ship, deliver, cancel, payments to refund), products (add, edit, bulk upload, hide / unhide), categories, brands, carousel slides, sale, users
- AI shopping assistant
- English / Hindi header and 4 theme colours
- Works on phone, tablet and desktop, with loading skeletons

## Tech

Next.js 15 (React 19), TypeScript, Tailwind CSS, Zustand

## Run on your computer

1. Start the backend first (default `http://localhost:8000`).
2. Install packages:

   ```bash
   npm install
   ```

3. Create the env file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell use `copy .env.example .env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## Env

| Name | What it is |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend URL (required for `npm run build`) |
| `NEXT_PUBLIC_SITE_URL` | This website's URL, used for SEO links |
| `INTERNAL_API_KEY` | Server-only, same value as the backend's `INTERNAL_API_KEY`. Server-rendered pages send it so all visitors' page loads do not share one rate limit. Never name it `NEXT_PUBLIC_...` |

## Scripts

| Command | Use |
| --- | --- |
| `npm run dev` | Run in development |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Check code |
| `npm run typecheck` | Check types |
| `npm run format` | Format the code with Prettier (version pinned in `package.json`) |

## Pages

| Route | Page |
| --- | --- |
| `/` | Home |
| `/products` | Category, search and filtered lists |
| `/products/[slug]` | Product details |
| `/cart` | Cart |
| `/checkout` | Address step (`?step=payment` for payment, `?buy=slug` for Buy now) |
| `/order-placed?id=` | Payment pending or order confirmed |
| `/orders`, `/orders/[id]` | My orders and order details |
| `/account` | Profile and addresses |
| `/login` | Mobile + OTP login |
| `/admin/...` | Admin panel |

## Folders

```text
src/
  app/          routes (pages, layouts, loading screens)
  api/          backend API calls
  components/   app shell, header, footer, sidebar, product card and small shared UI
  features/     page code: home, shop, product, cart, checkout, orders, account, login, assistant, admin
  hooks/        shared React hooks
  lib/          types and helpers
  store/        login, cart count, toast, theme / language and assistant state
```

Code rules are in `AGENTS.md`. A file-by-file guide to the code and its main flows is in [CODE-MAP.md](CODE-MAP.md).

## Images

`next.config.mjs` allows images from Cloudinary (admin uploads) and `picsum.photos` (only the seed's demo images). When every product uses an uploaded image, remove the `picsum.photos` line.

## Admin

Log in with the admin phone number set in the backend (`SUPER_ADMIN_PHONE`). Admins open the admin panel after login, and the Admin link shows in the top strip.
