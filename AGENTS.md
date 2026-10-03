# ApnaKart frontend guide

This file applies to the complete `ecommerce-frontend` folder. It extends the
repository rules in `../AGENTS.md`. If the two files differ, follow this file for
frontend work.

## Product and stack

ApnaKart is a responsive Indian ecommerce storefront with a separate admin
workspace.

- Next.js 14 App Router
- React 18 and TypeScript with strict mode
- Tailwind CSS
- Zustand for small global client state
- `next-themes` for light and dark mode
- Lucide React for icons
- Backend API for products, users, cart, orders, OTP and payments
- Razorpay for online checkout

Do not add a library when React, Next.js, Tailwind or a small local function can
solve the task clearly.

## Code style

Write practical code that a junior developer can follow.

- Use short, clear English names. Prefer `selectedAddress` over `currentData`.
- Keep functions focused on one job. Use early returns for loading, error and
  empty states.
- Keep JSX readable. Split a component when it handles unrelated sections or
  when a part is reused.
- Do not create a hook, helper, wrapper or configuration object for one tiny use.
- Extract shared behavior only when at least two real consumers need it.
- Do not use `any`, ignored TypeScript errors or unsafe type casts to hide a bug.
- Do not keep commented code, TODO placeholders, unused exports or duplicate
  components.
- Comments should explain a reason or backend rule. Do not explain obvious code.
- User text must be short and simple. Avoid marketing filler and technical words.
- Use existing UI classes and color tokens before writing new long class lists.
- Use the `@/` alias across folders. A same-folder import may use `./file-name`.
- Keep customer and admin code separate. Share only small UI primitives and
  truly common hooks.

### Naming

- Files and folders: `kebab-case.tsx` or `kebab-case.ts`.
- React components and types: `PascalCase`.
- Functions and variables: `camelCase`.
- Hooks: start with `use`.
- Boolean names: start with `is`, `has`, `can`, `should` or a clear state word
  such as `loading` and `failed`.
- Event props: `onSave`, `onClose`, `onChange`.
- Local event functions: `handleSave`, `handleClose`, `handleChange`.
- Constants: `UPPER_SNAKE_CASE` only for fixed module-level values.

## Folder map

```text
src/
  app/                    Next.js routes, metadata, sitemap, robots, loading/error files
  api/                    One file per backend module; the only place that knows URLs
    http.ts               fetch wrapper: token, refresh on 401, timeouts, errors
    auth.ts catalog.ts cart.ts order.ts account.ts admin.ts
  components/
    layout/               Header, drawer, footer, providers and app shell
    ui/                   Button, Spinner, skeletons, SafeImage and small notices
  features/
    account/              Profile and saved address flow
    admin/                Admin shell and all management screens
    auth/                 Phone number and OTP login/sign-up
    cart/                 Customer cart
    catalog/              Home, search, product list and product detail
    checkout/             Address, payment and order placement
    orders/               Customer order history and cancellation
  hooks/                  Shared client behavior used by multiple features
  lib/                    Types, formatting, SEO site URL, Razorpay and fallbacks
  store/                  Small global Zustand stores
```

### Where new code goes

| Work                                           | Correct location              |
| ---------------------------------------------- | ----------------------------- |
| Add or change a URL                            | `src/app/<route>/page.tsx`    |
| Build the UI and behavior for that page        | `src/features/<feature>/`     |
| Change header, drawer, footer or page shell    | `src/components/layout/`      |
| Any button with text                           | `<Button>` from `ui/button`   |
| Add a small reusable loader or notice          | `src/components/ui/`          |
| Add a shared hook used by two or more features | `src/hooks/`                  |
| Call a backend endpoint                        | `src/api/<module>.ts`         |
| Change fetch, token or error behavior          | `src/api/http.ts`             |
| Add or change an API response type             | `src/lib/types.ts`            |
| Add money, date or slug formatting             | `src/lib/format.ts`           |
| Add backend-free catalog names                 | `src/lib/catalog-fallback.ts` |
| Open the Razorpay popup                        | `src/lib/razorpay.ts`         |
| Add genuinely global client state              | `src/store/`                  |
| Add feature-only state or helper               | Keep it inside that feature   |

Do not put page business logic in `src/app`. Route files should fetch server
data, set metadata, handle `notFound`, and render one feature component.

## Route map

### Customer routes

| Route              | Route file                         | Main implementation                        |
| ------------------ | ---------------------------------- | ------------------------------------------ |
| `/`                | `src/app/page.tsx`                 | `src/features/catalog/home-content.tsx`    |
| `/products`        | `src/app/products/page.tsx`        | `src/features/catalog/product-listing.tsx` |
| `/products/[slug]` | `src/app/products/[slug]/page.tsx` | `src/features/catalog/product-details.tsx` |
| `/login`           | `src/app/login/page.tsx`           | `src/features/auth/phone-auth-form.tsx`    |
| `/cart`            | `src/app/cart/page.tsx`            | `src/features/cart/cart-page.tsx`          |
| `/checkout`        | `src/app/checkout/page.tsx`        | `src/features/checkout/checkout-page.tsx`  |
| `/orders`          | `src/app/orders/page.tsx`          | `src/features/orders/orders-page.tsx`      |
| `/account`         | `src/app/account/page.tsx`         | `src/features/account/account-page.tsx`    |

### Admin routes

All admin routes use `src/app/admin/layout.tsx` and
`src/features/admin/admin-shell.tsx`.

| Route                  | Feature file                                   |
| ---------------------- | ---------------------------------------------- |
| `/admin`               | `admin-home.tsx` (stats from `GET /api/admin/stats`) |
| `/admin/products`      | `products-page.tsx`                            |
| `/admin/products/new`  | `new-product-page.tsx` and `product-form.tsx`  |
| `/admin/products/[id]` | `edit-product-page.tsx` and `product-form.tsx` |
| `/admin/products/bulk` | `bulk-product-upload.tsx`                      |
| `/admin/orders`        | `orders-page.tsx`                              |
| `/admin/categories`    | `categories-page.tsx`                          |
| `/admin/brands`        | `brands-page.tsx`                              |
| `/admin/banners`       | `banners-page.tsx`                             |
| `/admin/users`         | `users-page.tsx`                               |

## App startup and layout flow

1. `src/app/layout.tsx` loads fonts, metadata, global CSS and `Providers`, and
   reads the menu categories on the server (cached home data, ISR 60 s), so
   category links are in the first HTML for search engines.
2. `src/components/layout/providers.tsx` restores UI settings and the login
   session after the client mounts, then reads `GET /api/user/me` so the role
   is the backend's current role. The admin panel link and routes depend on
   that fresh role, never on the role saved in the browser.
3. `src/components/layout/app-shell.tsx` checks the current path.
4. Customer pages get `SiteHeader`, customer `<main>`, `SiteFooter` and
   `Toaster`.
5. Admin pages get only the admin workspace and `Toaster`; customer navigation
   must not wrap admin pages.

Keep one `<main>` landmark per page. The customer shell owns the customer
`<main>`. The outer admin branch in `AppShell` is a `div`, so `AdminShell` owns
the admin `<main>`.

## API rules

Components never write a URL or call `fetch`. They call a small function from
`src/api/<module>.ts` (for example `getCart()`, `checkout()`, `listOrders()`),
which returns plain data. A new endpoint means one new function there.

`src/api/http.ts` holds the transport used by those files:

- `serverGetResult<T>`: server component request that preserves HTTP status.
  Use it when `404` must be different from an offline backend.
- `serverGet<T>`: safe server component request that returns `null` on failure.
- `publicGet<T>`: browser request for public endpoints.
- `http.get/post/patch/delete`: authenticated JSON requests.
- `http.postForm/patchForm`: authenticated file or form uploads.
- `errorMessage`: converts an unknown error to safe user text.
- `restoreSession`: restores access with the refresh session.
- `logoutSession`: asks the backend to log out, clears local auth, reloads `/`.

Backend response rules:

- Detail responses normally use `{ data: value }` and `ApiData<T>`.
- Paginated responses use `{ items, nextCursor }` at the root.
- Do not silently change response shapes inside a component.
- Money travels as integer paise. Display rupees with `inr()`.
- Price filter inputs are rupees for the user and are converted to paise before
  they are sent to the backend.
- Authentication, roles, stock, totals, discounts and payment success are
  trusted only when the backend confirms them.
- Redis is a backend concern. The frontend only sends search and filter values.

If an endpoint contract must change, update `src/lib/types.ts`, the API call and
every consumer together. Do not weaken backend validation to make the UI pass.

## Authentication flow

Main files:

- `src/features/auth/phone-auth-form.tsx`
- `src/store/auth-store.ts`
- `src/components/layout/providers.tsx`
- `src/hooks/use-auth-guard.ts`

Flow:

1. The user enters a valid 10-digit Indian mobile number.
2. `POST /api/auth/send-otp` sends the OTP.
3. The user enters the six-digit OTP. Paste is supported. Like the backend,
   the OTP is valid for 2 minutes (countdown shown) and resend unlocks after
   60 seconds.
4. `POST /api/auth/verify-otp` returns the access token and user role. The
   refresh token arrives as an httpOnly cookie that JavaScript never reads.
5. The access token stays in memory. Only phone and role hints are saved
   locally.
6. On reload, `Providers` rehydrates the store and calls `POST /api/auth/refresh`
   (cookie only, no body) to get a new access token.
7. `useAuthGuard` protects customer pages. `useAdminGuard` also checks the role.
8. Logout calls `POST /api/auth/logout`, clears local state and reloads `/`.

Frontend guards are for user experience only. The backend must enforce every
protected action. Preserve the safe `next` path check; never allow an external
redirect through the login URL.

## Header, category navigation and responsive drawer

Main files:

- `src/components/layout/site-header.tsx` (sticky top bar)
- `account-menu.tsx`, `search-box.tsx`, `header-settings-menu.tsx`
- `category-bar.tsx` (tablet and bigger, scrolls away)
- `mobile-sidebar.tsx` (phones only)
- `src/lib/ui-text.ts`

Current behavior:

- Order: menu button (phone only) → logo + name → search → account → cart → ⋮.
- Search works like big stores: while typing (2+ letters, debounced) it shows
  only text suggestions; products appear on the results page after Enter, the
  search button or a click on a suggestion. ✕ clears the box, and it is
  cleared after a search.
- Guest sees "Login". A logged-in user gets a menu: admin panel (admins only),
  profile, orders, saved addresses (`/account#addresses`), cart and logout.
- ⋮ holds theme (light/dark), menu language, app colour and help.
- Below `md` the hamburger opens the sidebar: admin panel on top (admins
  only), main links, then every category with its subcategories.
- From `md` up the sidebar is hidden and the category bar (image + name, plus
  an "All categories" mega menu) sits under the top bar.
- Category data is passed in from the server layout; fallback category names
  remain usable when the backend is offline.
- Cart badge state comes from `useCartStore`; cart contents stay server-backed.

Do not show admin navigation to a normal user. Do not remove backend admin
checks because the link is hidden.

## Home flow

Main files:

- `src/app/page.tsx`
- `src/features/catalog/home-content.tsx`
- `banner-carousel.tsx`
- `category-showcase.tsx`
- `lazy-category-shelves.tsx`
- `recently-viewed-products.tsx`
- `home-retry.tsx`

Flow:

1. The route requests `GET /api/home` on the server.
2. If home data fails, it renders `HomeRetry` with `fallbackCategories`, so the
   page and navigation stay useful.
3. The banner carousel moves every three seconds and pauses on hover.
4. Category cards clearly separate category names from subcategory links.
5. Trending, discount, featured and new-arrival shelves show at most eight
   products.
6. Order: banner → categories → recently viewed → trending → offers →
   featured → "Best of <category>" blocks → new arrivals.
7. Each "Best of" block has one shelf per subcategory (10 products). A shelf
   loads only near the viewport (`IntersectionObserver`) and shows skeletons
   while waiting; an empty subcategory is left out.
8. Recently viewed stores only slugs on the device and loads fresh cards from
   `GET /api/products/batch?slugs=`. A blocked local storage API must never
   break shopping.

If product API data is unavailable, keep headings, categories, skeletons, retry
controls and page navigation visible. Never invent product prices, stock or
images.

## Catalog search and product list flow

Main files:

- `src/features/catalog/product-listing.tsx`
- `src/features/catalog/product-filters.tsx`
- `src/features/catalog/product-card.tsx`
- `src/features/catalog/product-scroller.tsx`

Supported URL filters:

- `q` (at least 2 characters)
- `category` (parent slug) or `subcategory` (child slug)
- `section=trending|featured`
- `discount=true`
- `brand` (brand slug)
- `color`
- `minPrice`, `maxPrice` (rupees in the URL, sent to the API as paise)
- `sort=latest|price_asc|price_desc|discount|rating`

Flow:

1. URL values provide the starting search and filter state.
2. `GET /api/catalog/filters` supplies valid brand, color and price range.
3. Price typing is debounced before a product request.
4. `GET /api/catalog` returns cursor-paginated product cards.
5. Load-more failure keeps already loaded products visible.
6. Desktop and mobile filters share the same `ProductFilters` UI.

Do not add a fake client-side Redis layer or filter a partial page in memory.
Search, sorting and facets belong to the backend query.

## SEO and rendering

- Home and product list pages are static and rebuilt in the background (ISR);
  the root layout sets `revalidate = 60`, so a page built while the backend was
  down never stays on fallback content.
- Product pages render on the server with the fetch cache (5 min) and send
  `generateMetadata` (title, description, canonical, Open Graph) plus
  Product JSON-LD (price, stock, rating).
- `src/app/sitemap.ts` lists home, product list, every category and the home
  products; `robots.ts` points to it and blocks private pages. Admin pages are
  also `noindex`.
- Below-the-fold data (category shelves, related products) loads only near the
  viewport, and images use `next/image` lazy loading.

## Product detail flow

Main files:

- `src/app/products/[slug]/page.tsx`
- `src/features/catalog/product-details.tsx`
- `product-gallery.tsx`
- `add-to-cart.tsx`
- `related-products.tsx`
- `product-unavailable.tsx`

Flow:

1. The server route requests `GET /api/products/:slug`.
2. A real `404` uses `notFound()`. A network failure shows a retry page.
3. Metadata uses the same product response.
4. The gallery shows one large image and up to six clickable thumbnails.
5. Category, brand and color links open a filtered product list.
6. Price, discount, stock and description come from real data.
7. Add to cart shows a spinner while the request runs. Buy now is a link to
   `/checkout?buy=<slug>` (login first for guests) and never touches the cart.
8. Related products load lazily from `GET /api/products/:slug/related`.
9. Opening a product updates the device-only recently viewed list.

Missing or failed image URLs must use `SafeImage`; do not render a broken image.

## Ratings and reviews

- `rating-badge.tsx` shows the green "4.3 ★ (120)" chip on cards and the
  product page (hidden until the first review).
- `product-reviews.tsx` loads reviews only when scrolled near
  (`GET /api/products/:slug/reviews`, cursor pagination). A logged-in user
  can write or edit a review (`POST`); the backend allows it only after a
  delivered order and its message is shown as is. Admins see "Remove"
  (`DELETE /api/admin/reviews/:id`).
- The product gallery opens a full-screen preview (arrows, ←/→, Esc).

## Cart flow

Main files:

- `src/features/cart/cart-page.tsx`
- `src/store/cart-store.ts`
- `src/features/checkout/checkout-steps.tsx`

Flow:

1. `useAuthGuard` waits for login readiness.
2. `GET /api/cart` loads the server cart.
3. Quantity updates use `PATCH /api/cart/:productId`.
4. Remove uses `DELETE /api/cart/:productId`.
5. The global store holds only the navbar item count.
6. Product values, totals and savings always come from the server cart response.
7. Hidden, out-of-stock or over-stock items stay visible with a warning, are left
   out of the total, and block checkout until the user fixes them.

Keep the cart title and checkout steps visible during loading or API failure.

## Checkout and payment flow

Main files:

- `src/features/checkout/checkout-page.tsx`
- `payment-methods.tsx`
- `checkout-steps.tsx`
- `order-summary.tsx` (price card shared with the cart page)
- `src/features/account/address-form.tsx`

Flow:

1. Load `GET /api/address` and `GET /api/cart` after auth is ready. With
   `?buy=<slug>` the item list is just that product (`GET /api/products/:slug`,
   quantity 1-10) and checkout sends `buyNow: { productId, quantity }`; the
   cart stays as it is.
2. The user selects or creates a delivery address. The current UI allows up to
   five saved addresses.
3. Payment choices are UPI apps, card/netbanking or cash on delivery.
4. Google Pay and PhonePe are UPI choices handled inside Razorpay; they are not
   separate backend payment methods.
5. UPI and card choices send backend `PaymentMethod = ONLINE`.
6. Cash on delivery sends `PaymentMethod = COD`.
7. `POST /api/order/checkout` sends `idempotencyKey` (one per checkout page),
   creates the order and returns Razorpay values when online payment is required.
8. Only backend-confirmed values are sent to Razorpay.
9. The cart badge is cleared (cart orders only) and My Orders opens with `?placed=cod`, `paid`
   or `pending` (popup closed or failed); each shows its own banner. After
   `paid` the list is read again after 5 seconds, when the webhook has
   confirmed the order. A pending order shows its pay-by time.
10. Payment dismissal or failure keeps the saved order visible in My Orders.
11. The order is confirmed only by the backend webhook, never by the browser.

Do not collect or store card numbers, UPI PINs or payment secrets in this app.
Do not mark an online order paid from frontend state alone.

## Orders flow

Main files:

- `src/features/orders/orders-page.tsx`
- `src/hooks/use-paginated-list.ts`

Flow:

1. The shared pagination hook stays disabled until auth is ready.
2. `GET /api/order` loads cursor-paginated orders.
3. The page displays order, payment and fulfilment status.
4. Only unpaid pending or confirmed orders show cancellation.
5. `PATCH /api/order/:id/cancel` performs cancellation.
6. The local row changes only after the backend accepts the request.
7. An unpaid online order shows "Pay now" until its deadline;
   `POST /api/order/:id/payment` returns the same Razorpay order again.

## Account and address flow

Main files:

- `src/features/account/account-page.tsx`
- `src/features/account/address-form.tsx`

Flow:

- `GET /api/user/me` loads the profile.
- `PATCH /api/user/me` updates name and email.
- `GET /api/address` loads addresses.
- `POST /api/address` creates an address.
- `PATCH /api/address/:id` edits or makes an address default.
- `DELETE /api/address/:id` removes an address, then the list is reloaded
  because the backend may pick a new default.

Keep profile and address forms labelled, keyboard-friendly and usable on a
small phone.

## Admin flow

Main files:

- `src/features/admin/admin-shell.tsx`
- `use-admin-data.ts`
- `use-product-options.ts`

Rules:

- `useAdminGuard` controls the frontend entry experience; backend roles remain
  authoritative.
- The admin shell is visually separate from the customer shell.
- Product list, order list and user list use shared cursor pagination.
- `useAdminData` is the common loading/error/retry pattern for non-paginated
  admin data.
- `useProductOptions` loads categories and brands for product forms.
- Product price form values are rupees; the form sends `pricePaise`.
- Bulk upload needs at least one uploaded image per row (`/api/admin/uploads`).
- Order status options follow the backend rules: CONFIRMED comes only from
  payment, a paid order is never cancelled here, and `needsReview` orders are
  refunded from the Razorpay dashboard and then marked with
  `PATCH /api/admin/orders/:id/refunded`.
- Uploading state must block create, update or remove actions that would submit
  incomplete image data.
- Category, brand and banner screens must show different loading, error and
  empty states.
- `SafeImage` handles missing admin logos and banners.
- Only a super admin may see role-management controls, and the backend must
  enforce the same rule.

Do not combine all admin screens into one file. Do not copy fetching logic from
one admin screen to another.

## Global state

Use global state only for data needed across unrelated routes.

- `auth-store.ts`: in-memory tokens plus saved phone and role hints.
- `cart-store.ts`: navbar cart count only.
- `toast-store.ts`: short success and error messages.
- `ui-settings-store.ts`: menu language and app color.

Page data such as products, cart rows, addresses and orders must stay in the
feature that owns it or come directly from the server.

## Loading, failure and empty states

Every API-backed screen needs all three states:

1. Loading: use `CardSkeleton`, `GridSkeleton` or `ListSkeleton` for content
   and `<Button loading>` for actions; it shows a spinner and blocks a double
   click.
2. Failure: keep the page shell visible and show `OfflineNotice` or a small retry
   control.
3. Empty: say clearly that no items exist; do not show endless skeletons.

Use `LoadMoreButton` for cursor pagination. A load-more error must not erase
existing rows.

## Design and responsive rules

- Build mobile first, then add `sm`, `md`, `lg` and `xl` changes only where the
  layout needs them.
- Test narrow phone, tablet/medium, laptop and wide desktop layouts.
- Avoid fixed widths that can overflow. Use `min-w-0`, responsive grids and
  horizontal scrolling for shelves or navigation.
- Look: "Slate" — cool grey-blue page, white rounded-3xl cards with soft
  shadow, product images on a grey-blue tile, navy (`chrome`) and slate-blue
  (`accent`) pill buttons, Poppins headings over DM Sans body.
- Phones get a floating bottom tab bar (`bottom-nav.tsx`: Home, Shop, Cart,
  Account); from `md` up it is hidden and the header does that job.
- Reuse tokens from `src/app/globals.css`: `chrome`, `accent`, `gold`, `ivory`,
  `night`, `ink`, `mist` and `sand` (plus `leaf`, `deal` in the Tailwind
  config). App colour options (slate, teal, purple, orange) change only the
  accent.
- Use `<Button variant="primary|outline|ghost|danger">` for text buttons. The
  `btn-*` classes stay for links styled as buttons.
- Reuse component classes: `card`, `field`, `icon-button`, `section-title`,
  `eyebrow` and `status-pill`.
- Dark mode and selectable app colors must continue to work.
- Use Lucide icons already in the project. Do not create decorative inline SVGs.
- Controls need visible focus, labels and roughly 40px touch targets.
- Use semantic `header`, `nav`, `section`, `article`, `aside` and one `main`.
- Images need useful alt text unless they are decorative.

Do not copy Flipkart or Amazon branding. Use familiar ecommerce interaction
patterns while keeping ApnaKart's own colors and text.

## Security and data rules

- Never commit `.env.local`, tokens, payment keys or user data.
- Only public values may use `NEXT_PUBLIC_*`.
- Keep `.env.example` limited to safe example values.
- Do not store sensitive tokens in persistent browser storage.
- Do not bypass OTP, role, stock, address, order or payment validation.
- Do not build payment success from a query string or client-only flag.
- Use backend error messages only through `errorMessage` and keep fallback text
  safe and simple.
- Validate internal redirect paths before passing them to the router.
- Pass any admin or API supplied URL through `safeHttpUrl` before using it in an
  `href`, and any colour value through `safeColor` before using it in an inline
  style. Both live in `src/lib/sanitize.ts`.

## Change checklist

Before editing:

1. Read the route file, its feature file, relevant type and API call.
2. Search for an existing component or hook before creating a new one.
3. Confirm whether the endpoint returns `{ data }` or root pagination.
4. Check phone, medium and desktop behavior for layout changes.

Before handing off:

```powershell
npm run lint
npm run typecheck
npm run build
```

Also check:

- No unused import, export, variable or file.
- No duplicate component or helper.
- No URL or `fetch` outside `src/api/`.
- No broken loading, failure or empty state.
- No accidental customer navigation around admin pages.
- No generated `.next`, `.build-check`, `*.tsbuildinfo` or `.env.local` in a
  commit.
- Update this file when routes, folders, response contracts or major flows
  change.

If the local dev server locks `.next` on Windows, do not stop the user's server
without permission. Run an isolated verification build instead:

```powershell
$env:NEXT_BUILD_DIR='.build-check'
npm run build
```

The temporary build folder is ignored and may be removed after verification.
