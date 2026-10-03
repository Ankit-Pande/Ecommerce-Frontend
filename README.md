# ApnaKart Frontend

Online shopping website made with Next.js. It works with the ApnaKart backend API.

## Features

- Home page with banners, categories and product shelves
- Search with suggestions, filters, sort and load more
- Product page with images, reviews and related products
- Cart, Buy now and checkout (cash on delivery, or UPI apps and cards via Razorpay)
- Order confirmed page and order tracking (confirmed, shipped, delivered)
- Login with mobile number and OTP
- My orders, cancel order, pay again
- My account and saved addresses
- Admin panel: dashboard, orders, products, festival sale, categories, brands, banners, customers
- Works on phone, tablet and desktop, with light and dark mode

## Tech

Next.js 14, TypeScript, Tailwind CSS, Zustand

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
| `NEXT_PUBLIC_API_URL` | Backend URL |
| `NEXT_PUBLIC_SITE_URL` | This website's URL, used for SEO links |

## Scripts

| Command | Use |
| --- | --- |
| `npm run dev` | Run in development |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Check code |
| `npm run typecheck` | Check types |

## Folders

```text
src/
  app/          pages (routes)
  api/          backend API calls
  components/   header, footer and small shared UI
  features/     page code: catalog, cart, checkout, orders, account, auth, admin
  hooks/        shared React hooks
  lib/          types and helpers
  store/        login, cart count and toast state
```

## Admin

Log in with the admin phone number set in the backend (`SUPER_ADMIN_PHONE`). The Admin panel link shows in the account menu.
