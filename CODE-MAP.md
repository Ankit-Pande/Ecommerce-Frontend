# ApnaKart frontend — code map

This file explains what every file does and how the main flows work, so a developer (or an AI) can find the right place quickly. Rules for changing the code are in `AGENTS.md`; setup is in `README.md`. The backend has its own `CODE-MAP.md`.

Stack: Next.js 15 (App Router, React 19) + TypeScript + Tailwind + Zustand. Icons from `lucide-react`, font Plus Jakarta Sans (`next/font/google`). Money from the API is integer paise and is shown with `inr()`.

---

## 1. How a page is built

- **Server-rendered pages** (home, category lists, product pages, sitemap): server components call `api/catalog.ts` → `serverGetResult` / `serverGetPage` → `serverFetch` in `api/http.ts`. These requests are cached by Next.js for 60 seconds, time out after 5 s, never throw (the page shows a "try again" notice instead), and send `INTERNAL_API_KEY` in `x-internal-key` so the backend does not count every visitor's page load against the frontend server's one IP.
- **Browser requests** (cart, checkout, orders, account, admin, search results, "Load more"): client components call the functions in `src/api/*`, which use `http` / `publicGet` in `api/http.ts`. `http` sends the access token, and on a 401 refreshes it once with the refresh cookie (`restoreSession`) and retries; if that fails the user is logged out.
- **Login state**: the access token lives only in memory (`store/auth-store.ts`); the refresh token is an HttpOnly cookie set by the backend. On every page load `AppSetup` asks for a new access token when a phone number was saved (so guests make no refresh call).
- **Lists** use `hooks/use-paginated-list.ts` (cursor pagination, "Load more", stale results ignored).
- **Filters** of the product list live in the URL (`/products?category=…&maxPrice=…&sort=…`), so links and banners can open a filtered list.

---

## 2. Files

### `src/app/` — routes only

| File | What it does |
| --- | --- |
| `layout.tsx` | Root layout: font, `AppSetup`, and `AppShell` with the categories from the server (`getHomeOnServer`). |
| `page.tsx` | Home page, server-rendered and refreshed every 60 s; shows `HomeContent`, or `HomeRetry` if the API is down. |
| `products/page.tsx` | Product list. `generateMetadata`: category pages get a title, description and canonical link; search pages (`?q=`) are `noindex`. Category pages get their first page from the server (in the HTML for Google); search results load in the browser. |
| `products/[slug]/page.tsx` | Product page, server-rendered: metadata (title, description, canonical, share image), Product JSON-LD for Google, 404 for unknown slugs, `ProductUnavailable` when the API could not be reached. |
| `products/loading.tsx`, `products/[slug]/loading.tsx`, `loading.tsx` | Skeletons while a page loads. |
| `cart`, `checkout`, `order-placed`, `orders`, `orders/[id]`, `account`, `login` | Each `page.tsx` renders one feature component (checkout, order-placed and login sit inside `Suspense` because they read the URL). |
| `admin/layout.tsx` + `admin/**/page.tsx` | Admin pages inside `AdminShell`. |
| `error.tsx`, `global-error.tsx`, `not-found.tsx` | Error page with "Try again", root error page, 404 page. |
| `sitemap.ts` | `sitemap.xml`: home, `/products`, every category and subcategory, and the products shown on the home page. |
| `robots.ts` | `robots.txt`: cart, checkout, orders, account, admin and login are not crawled. |
| `globals.css` | Tailwind layers and the shared classes (`card`, `btn-primary`, `chip`, `field`, `product-grid`, `table-box`, …). |

### `src/api/` — calls to the backend (components never call `fetch` directly)

| File | What it does |
| --- | --- |
| `http.ts` | `serverFetch`, `serverGetResult`, `serverGetPage` (server side, see section 1); `publicGet` (browser, no login); `http` (browser with token, retry after refresh; `get`, `post`, `patch`, `delete`, `postForm`, `patchForm`); `restoreSession` (one refresh at a time); `errorMessage`; `logoutSession`. Timeouts: 15 s for reads, 30 s for writes. |
| `catalog.ts` | `getHomeOnServer`, `getProductOnServer`, `getCatalogOnServer` (server); `getProduct`, `getCatalog`, `getRelatedProducts` (browser); `catalogParams` turns the page URL into the API query and drops bad values. |
| `auth.ts` | `sendOtp`, `verifyOtp`. |
| `account.ts` | Profile (get, update, delete) and addresses (list, create, update, delete). |
| `cart.ts` | `getCart`, `addToCart`, `updateCartItem`, `removeCartItem` (each returns the new cart). |
| `order.ts` | `checkout`, `listOrders`, `getOrder`, `cancelOrder`, `verifyPayment`, `retryPayment`. |
| `review.ts` | `listReviews` (6 per page), `saveReview`. |
| `assistant.ts` | `askAssistant` (sends the chat, each message cut to 1,000 characters). |
| `admin.ts` | Every admin call: stats, orders, products (list, get, create, update, hide, bulk, image upload, sale), categories, brands, banners, reviews, users (list, block, role). Lists take 20 rows a page. |

Ids and slugs put in URLs always go through `encodeURIComponent`.

### `src/components/`

| File | What it does |
| --- | --- |
| `layout/app-setup.tsx` | `AppSetup`: on load restores theme and language, restores the login (refresh + profile) and applies the theme colour (`--color-accent`). |
| `layout/app-shell.tsx` | `AppShell`: header, category sidebar, footer, assistant button and toasts; admin and login pages get only the page and toasts. |
| `layout/site-header.tsx` | Top strip (language, 4 theme colours, track order, admin link), header (menu, logo, search box, login/account, orders, cart count) and the scrollable category band. `SearchWords` keeps the search box in sync with `?q=`. |
| `layout/category-sidebar.tsx` | Categories with subcategories: inline on `/products` at 1280 px and wider, a drawer everywhere else (closes on page change and Escape). |
| `layout/site-footer.tsx` | Customer care, top categories, help links, payment methods. |
| `product/product-card.tsx` | `ProductCard`, the one card used in every list (image, discount, price, rating, stock). |
| `product/card-buttons.tsx` | Add to cart / Buy now on a card; products with sizes or many colours show "Choose size / colour"; guests go to login first. |
| `ui/*` | `Button` (spinner while loading), `LoadMoreButton`, `LogoIcon`, `OfflineNotice` (retry), `QuantityStepper` (when stock fell below the quantity, − goes straight to the stock), `SafeImage` (`next/image` with a placeholder when the image fails), skeletons (`CardSkeleton`, `GridSkeleton`, `RowSkeleton`, `ListSkeleton`), `Spinner`, `StatusPill`, `Toaster`. |

### `src/features/` — page code, one folder per area

| Folder / file | What it does |
| --- | --- |
| `home/home-content.tsx` | Slides, categories and the Trending / Featured / New / Offers rows, each with "View all". |
| `home/banner-carousel.tsx` | Auto-moving slides with previous/next and dots; slide text comes from the category the link opens. |
| `home/home-retry.tsx` | Shown when the home page could not load. |
| `shop/product-listing.tsx` | The product list: title, subcategory pills, price / rating / sort chips (search pages sort by Relevance by default), product grid, "Load more". Changing a filter changes the URL (`setFilter`). Uses the server's first page when there is one. |
| `product/product-details.tsx` | Product page: breadcrumb, gallery, price, `AddToCart`, details table (category, brand, rating, stock, payment, specs), reviews, related products. |
| `product/add-to-cart.tsx` | Colour, size and quantity choice, Add to cart and Buy now (`/checkout?buy=…`). |
| `product/product-gallery.tsx` | Big image with thumbnails. |
| `product/product-reviews.tsx` | Star bars and reviews (loaded when scrolled near); buyers write or edit a review; admins can remove one. |
| `product/related-products.tsx` | "Related products" row, loaded when scrolled near. |
| `product/product-unavailable.tsx` | "Could not reach the store" with retry. |
| `cart/cart-page.tsx` | Cart lines with quantity and remove, price details, checkout button; `cart-problem.ts` says why a line cannot be ordered. |
| `checkout/checkout-page.tsx` | Checkout in two steps kept in the URL: address (with items and suggestions) then payment. `placeOrder` reuses one idempotency key while address, payment and items stay the same, so a double click cannot make two orders; online payment opens Razorpay, then the result page. Buy now (`?buy=slug`) checks out one product without touching the cart. |
| `checkout/payment-methods.tsx` | Payment choices (UPI apps, card, net banking, Cash on Delivery); the choice decides which Razorpay screen opens first. |
| `checkout/checkout-steps.tsx` | Cart → Address → Payment → Done bar. |
| `checkout/order-placed.tsx` | Result page: paid, waiting for payment (30-minute countdown, Pay now, "check payment"), or COD confirmed. |
| `orders/orders-page.tsx` | My orders with "Load more". |
| `orders/order-detail.tsx` | One order: status steps, items (buy again), address, payment, Pay now or Cancel (an unpaid online order goes back to the cart and the cart count is refreshed). |
| `orders/order-parts.tsx` | `OrderStatusPill`, `paymentText`, `canPay`, `canCancel`, `usePayAgain` (opens Razorpay again). |
| `account/account-page.tsx` | Profile form, logout, delete account, saved addresses (default, edit, delete). |
| `account/address-form.tsx` | Add / edit address (phone and pincode digits only). |
| `login/login-form.tsx` | Mobile number → OTP (6 boxes, paste works, 2-minute timer, resend after 60 s) → back to the page that sent the user (`safeNextPath`). |
| `assistant/assistant-widget.tsx` | Round button; loads the chat panel only when first opened. |
| `assistant/assistant-panel.tsx` | The chat: messages with product links, quick questions, Next / Who-is-it-for / Confirm chips. The chat history is kept in `ui-store`. |
| `admin/admin-shell.tsx` | Admin guard (`useAuthGuard(true)`), side menu, `AdminTitle`. |
| `admin/admin-home.tsx` | Today's numbers and the orders table. |
| `admin/orders-page.tsx` | All orders with filters (status, needs review), ship / deliver / cancel, "refunded". |
| `admin/products-page.tsx` | Product search, stock, reserved quantity (unpaid orders), hide / show. |
| `admin/product-form.tsx` | Add / edit form (price in rupees → paise, specs as "Key: value" lines, images); on edit only changed fields are sent. Used by `new-product-page.tsx` and `edit-product-page.tsx`. |
| `admin/bulk-product-upload.tsx` | Up to 50 products at once, images uploaded per row; existing slugs are skipped. |
| `admin/categories-page.tsx`, `brands-page.tsx`, `banners-page.tsx`, `sale-page.tsx`, `users-page.tsx` | Categories (two levels), brands, home slides, store/category sale, users (block, make admin — super admin only). |
| `admin/use-admin-data.ts`, `use-product-options.ts` | Load admin data once with loading/failed state; categories and brands for the product forms. |

### `src/hooks/`

| File | What it does |
| --- | --- |
| `use-paginated-list.ts` | Cursor-paged list with `loadMore` and `reload`; takes the server's first page when given. |
| `use-auth-guard.ts` | Sends guests to login and non-admins away from admin pages (the backend checks every request anyway). |
| `use-active-category.ts` | Which category / subcategory the current `/products` URL shows. |
| `use-in-view.ts` | `useInViewOnce`: true once an element is near the screen (late loading of reviews and related products). |
| `use-debounced-value.ts` | Waits until typing stops (admin search boxes). |

### `src/lib/`

| File | What it does |
| --- | --- |
| `types.ts` | TypeScript shapes of the backend's responses. Must match the backend. |
| `format.ts` | `inr`, dates and times, address lines, phone, ratings text, `orderNumber`, option text, `minutesAndSeconds`, `slugify` (max 120 characters, the API limit). |
| `links.ts` | `categoryHref`, `subcategoryHref`, `loginHref`, `buyNowHref`, `safeNextPath` (only paths on this site), `safeLink` (banner links). |
| `razorpay.ts` | `openRazorpay`: opens the Razorpay window with the order details from the backend. |
| `colors.ts` | Card background tints. |
| `site.ts` | `SITE_URL`, support phone and email. |

### `src/store/` (Zustand)

| File | What it does |
| --- | --- |
| `auth-store.ts` | Access token (memory only), phone and role (saved in `localStorage`), `logout`, `isAdmin`. |
| `cart-store.ts` | Cart count in the header. |
| `toast-store.ts` | Toast messages (`toast.success`, `toast.error`, hidden after 3.5 s). |
| `ui-store.ts` | Theme colour and language (saved), menu/sidebar state, assistant open state and chat messages. |

### Config files

| File | What it does |
| --- | --- |
| `next.config.mjs` | Fails the build without `NEXT_PUBLIC_API_URL`; allowed image hosts (Cloudinary, and `picsum.photos` for seed images only); security headers. |
| `tailwind.config.ts` | Fresh Mint colour tokens (`ground`, `ink`, `accent`, …), font, shadows, page width. |
| `.env.example` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_API_KEY` (server-only). |

---

## 3. Main flows

1. **First load**: `layout.tsx` (server) gets categories → `AppShell` → `AppSetup` restores theme, language and login.
2. **Login**: `/login` → `sendOtp` → `verifyOtp` → token in memory, phone and role saved → back to `next`.
3. **Browse**: `/products?category=…` → first page from the server → "Load more" and filter changes in the browser (`getCatalog`).
4. **Search**: header search box → `/products?q=…` → results load in the browser (best match first, or the chosen sort over every match).
5. **Product**: `/products/[slug]` (server) → reviews and related products load when scrolled near → Add to cart / Buy now (guests go to login first).
6. **Checkout**: `/checkout` (address) → `?step=payment` → `placeOrder`:
   - COD → `/order-placed?id=…` (confirmed);
   - online → Razorpay window → `verifyPayment` → `/order-placed?id=…`. If the window is closed, the order waits 30 minutes; Pay now from the result page or the order page.
7. **Orders**: `/orders` → `/orders/[id]` → cancel (unpaid, not shipped) or pay again.
8. **Admin**: admins see the Admin link; `/admin/*` pages call `api/admin.ts`; every change is checked again by the backend.
9. **Assistant**: round button → chat panel → `askAssistant`; risky actions show Confirm / Cancel chips.

---

## 4. Rules to remember

- No secrets in the browser: only `NEXT_PUBLIC_*` values reach it; `INTERNAL_API_KEY` is read only in `serverFetch`.
- Never collect card or UPI details; online payment always goes through the Razorpay window, and an order counts as paid only when the backend says so.
- Pages must work at 390, 1024 and 1440 px without sideways scrolling; show skeletons while loading.
