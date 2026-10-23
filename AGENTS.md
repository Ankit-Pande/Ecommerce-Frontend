# AGENTS.md — ApnaKart frontend

Rules for anyone (human or AI agent) changing this repo. Read this before writing code. What each file does is in `CODE-MAP.md`.

## What this is

Next.js 15 (App Router, React 19) + TypeScript + Tailwind + Zustand. Storefront and admin panel for the ApnaKart backend API. Icons come from `lucide-react` and the font is Plus Jakarta Sans via `next/font/google`. Do not add other UI or state libraries.

`package.json` overrides `postcss` so Next's own copy uses the patched version; keep the override when upgrading Next. Run `npm audit --omit=dev` before a deploy.

## Folder rules

`src/` holds only these folders. Do not add new top-level folders.

| Folder | Holds |
| --- | --- |
| `app/` | Routes only: `page.tsx`, `layout.tsx`, `loading.tsx`, metadata. A page renders one feature component. |
| `api/` | One file per backend area. `http.ts` has the fetch helpers (timeouts, token refresh, errors). Components never call `fetch` directly. |
| `components/layout/` | App shell, header, footer, category sidebar, app setup |
| `components/product/` | `ProductCard` and its buttons (used on many pages) |
| `components/ui/` | Small shared pieces: `Button`, `StatusPill`, `QuantityStepper`, `SafeImage`, skeletons, toaster |
| `features/<area>/` | Page code for one area: home, shop, product, cart, checkout, orders, account, login, assistant, admin |
| `hooks/` | Hooks used by two or more features |
| `lib/` | `types.ts` (same shape as backend responses), `format`, `links`, `colors`, `razorpay`, `site` |
| `store/` | Zustand stores: auth, cart count, toasts, UI (theme, language, drawer, assistant) |

A file used by only one feature lives in that feature's folder.

## Code style

- Plain code that a beginner can read. No TODOs, no dead code, no unused exports, no "for later" helpers.
- Every function (components, hooks, handlers, store actions with a body) has exactly one short `//` line right above it that says what it does. A table of one-line functions (like `http` or `toast`) gets one line above the table. No other comments.
- No short names: `response` not `res`, `error` not `err`, `product` not `p`.
- Names say what things are: `cartLines`, `placeOrder`, `canCancel`, `shippingAddress`.
- Components use named exports (`export function CartPage`). Files in `app/` use `export default function CartRoute`.
- In `app/` pages and `generateMetadata`, `params` and `searchParams` are Promises: `await` them.
- A helper is fine only when two or more places use it or it makes the caller clearly shorter.
- `if` or ternary: a ternary only picks one of two simple values or one of two pieces of JSX (`{loggedIn ? <Account /> : <LoginLink />}`). Use `if` for actions (saving, removing, choosing which API to call) and for three or more states: set a variable before `return` (`let listSection; if (loading) ... else if (failed) ... else ...`) and put `{listSection}` in the JSX. Never nest ternaries. An `if` whose body goes onto its own line gets braces.
- Money from the API is integer paise. Show it with `inr()`.
- `lib/types.ts` must match what the backend sends. Do not add fields the backend does not send.
- Format with Prettier defaults: `npm run format` (Prettier is pinned in `package.json`).

## Design rules (Fresh Mint)

- Colours are Tailwind tokens in `tailwind.config.ts`: `ground`, `soft`, `ink`, `ink-2`, `muted`, `line`, `field`, `accent`, `discount`, `danger`, `sunny`, `sunny-light`, `grey`, `grey-strong`, `grey-ink`, `mint`. `accent` is a CSS variable that the theme picker changes. Card tints live in `lib/colors.ts`.
- Shared classes are in `app/globals.css`: `card`, `page-title`, `section-title`, `field`, `label`, `btn-primary`, `btn-big`, `btn-outline`, `btn-line`, `btn-grey`, `btn-danger`, `btn-remove`, `chip`, `status-pill`, `product-grid`, `scroll-row`, `table-box`, `table-head`, `data-row`, `btn-table`. Reuse them before adding new ones.
- One `ProductCard`, one `StatusPill`, one `QuantityStepper` and one small grey button (`btn-grey`) everywhere.
- No fixed page widths. Use `flex-wrap` with flex-basis. Pages must work at 390, 1024 and 1440 px with no horizontal page scroll. Admin tables scroll inside `.table-box`.
- The category sidebar is inline only on `/products` at 1280 px and wider. Everywhere else it is a drawer.
- Show skeletons while loading. Reviews and related products load only when they come into view.
- Functional text only: no marketing lines or filler.
- Use real `<button>`, `<a>`, `<input>` + `<label>`. Icon-only buttons need `aria-label`.

## Data and security rules

- The access token lives only in memory (Zustand). The refresh token is an HttpOnly cookie set by the backend. Only phone and role are saved in `localStorage`.
- Pages that need login call `useAuthGuard()`, admin pages `useAuthGuard(true)`. This is only for the user experience; the backend checks every request.
- Redirect targets go through `safeNextPath()`. Links typed by an admin go through `safeLink()`.
- Never collect card or UPI details in our pages. Online payment opens the Razorpay window (`openRazorpay`). An order counts as paid only when the backend says so.
- Checkout sends an idempotency key and reuses it for the same address, payment type and items, so a double click cannot make two orders.
- Lists use cursor pagination through `usePaginatedList`. `/products` fetches the first page on the server (`getCatalogOnServer`) and passes it as `firstPage`, so category pages are in the HTML for search engines; later pages and filter changes load in the browser. Search pages (`?q=`) are not indexed, so their results always load in the browser, where the backend's per-visitor search limit applies.
- Server-side fetches (`serverFetch` in `api/http.ts`) send `INTERNAL_API_KEY` in the `x-internal-key` header so the backend does not count every visitor's page load against the frontend server's one IP. It is a server-only env variable: never read it in client code and never rename it to `NEXT_PUBLIC_...`.
- `/products` sets its own title and canonical link per category; search result pages (`?q=`) are `noindex`.
- Guests (no saved phone) do not call `/api/auth/refresh` on load.
- Slugs and ids put in URLs are passed through `encodeURIComponent`.
- Product filters live in the URL (`/products?category=...&maxPrice=...&minRating=...&sort=...`), so links and banners can open a filtered list.

## Checks before you finish

1. `npm run lint`
2. `npx tsc --noEmit` (also `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`)
3. `npm run build` (needs `NEXT_PUBLIC_API_URL`)
4. `npx prettier --check src`
5. Open every changed page at 390, 1024 and 1440 px.
