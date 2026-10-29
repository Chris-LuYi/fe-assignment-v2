# Meridian Banking — <Your Name>

- Deployed: <url>
- Run locally: `npm install && npm run dev`
- Checks: `npm run check` (lint + typecheck + tests) and `npm run build`. CI runs both on every push/PR (`.github/workflows/ci.yml`).
- Demo states: add `?debug` to the URL for a small debug menu (see [Loading, empty and error states](#loading-empty-and-error-states)).

## Project structure

```
src/
  api/              Typed data layer. Components never call fetch.
    client.ts         apiFetch + ApiError (starter)
    types.ts          API types (starter)
    queries.ts        Query keys, queryOptions for each GET, useCreateTransfer mutation
    scenario.ts       Demo-only: appends ?scenario= / ?delay= to GETs
  components/       Generic UI with no business knowledge
                    Button, Dialog (native <dialog>), Field, SearchInput,
                    Skeleton, EmptyState, Alert, Header, SegmentSwitch
  features/
    dashboard/      Dashboard page: useDashboardData, BalanceHero, AccountList,
                    TransactionList (+ search), DailyLimitCard, skeleton, error
    transfer/       TransferDialog (step state + form), one component per step,
                    Stepper, SuccessPanel, schema.ts (all validation rules)
    preferences/    Theme + segment: read/write <html> attributes and localStorage
    debug/          ?debug menu for switching mock API scenarios
  lib/              Pure helpers: format.ts (starter), accounts.ts (totals, limit)
  test/             MSW server setup, renderApp helper
index.html          Inline script that applies theme/segment before first paint
```

Rule of thumb: `components/` don't know about banking, `features/` own a
screen, and anything derived from API data (totals, remaining limit) is a pure
function in `lib/` so it's computed on render and unit-testable.

## Decisions and trade-offs

**Server state vs UI state.** All API data lives in TanStack Query — nothing is
copied into `useState`. Each endpoint has a `queryOptions` object in
`api/queries.ts`, so the dashboard, header and transfer dialog share the same
cache entry by importing the same object. UI state (`step`, search text, dialog
open, discard confirmation) is local `useState` in the component that owns it.
The total available and remaining daily limit are derived on render
(`lib/accounts.ts`), never stored.

**Dashboard loading (D1).** `useDashboardData` runs the three queries in
parallel and returns one status for the page: skeleton until all three resolve,
error if any fails (only once nothing is still fetching, so Retry doesn't flicker
between skeleton and error). Retry refetches only the failed queries. The skeleton
renders the same cards and row heights as the real page so nothing jumps.

**Search (D6): in the browser, not `q`.** The dashboard only ever shows the 8
loaded rows, and they're already in memory, so filtering locally is instant and
costs no request per keystroke. Using `q` would also change the meaning ("search
all history" vs "filter what I see"), which I'd only do with a "see all" view.

**After a transfer: invalidate, don't patch.** On success, the mutation
invalidates `customer`, `accounts` and `transactions`. The response has the new
balance and limit but not the new transaction row, so patching would mean
building a fake transaction on the client. Invalidating keeps the server as the
only source of truth. The `onSuccess` returns the invalidation promise, so the
mutation stays pending until the refetch finishes — the success screen only
appears once the dashboard behind it is already correct (costs ~500 ms more of
`Sending…`). The callback is on the hook (not on `mutate`) so it still runs if
the dialog closes mid-request.

**Forms and validation (§3.3, E3).** React Hook Form + Zod. Every rule is
written once in `features/transfer/schema.ts`. The amount rules depend on live
data (chosen account's balance, remaining limit), so the schema is built by
`createTransferSchema({ accounts, remainingLimit })` and memoised. The object
shape only checks types; rules run in `superRefine` because they depend on
other fields (new recipient vs saved payee, chosen account). The same schema
drives:
- inline errors when a field is left (`mode: 'onTouched'`),
- each step's `Continue` (`trigger(stepFields, { shouldFocus: true })`, which also
  focuses the first invalid field),
- `Confirm transfer` (`handleSubmit`). If data went stale between steps, it sends
  the user back to the step with the error.

The amount is kept as the typed string and converted in `toTransferRequest`, so
"10.123" can be rejected for its format instead of being silently rounded.

**API errors (T7).** 5xx → stay on review, keep everything, show the brief's
`Something went wrong…` copy in `role="alert"`, `Confirm transfer` retries. 4xx
with `fields` → show the API's `message` and field messages in the alert and
attach each field message to its input with `setError`, so it's there when the
user goes `Back`. API field names are mapped to form field names in one table.

**No double sends (T5).** While sending, the button reads `Sending…` and is
`aria-disabled`, and the submit handler returns early if a request is in flight.
I used `aria-disabled` rather than `disabled` so keyboard/screen-reader focus
isn't dropped to `<body>` mid-send. Closing the dialog is also blocked while
sending, so the user never wonders whether money moved.

**Dialog (T1).** Native `<dialog>` + `showModal()` gives the focus trap, inert
background, top layer and Esc for free; no library needed. The wrapper restores
focus to whatever opened it. On each step change focus moves to the step title,
so screen-reader users start at the top. Esc on a half-filled form shows the
optional `Discard this transfer?` confirmation. Full-screen sheet below 1024 px,
520 px centred dialog above.

**Accessibility (T8, TH3).** Payees + "Send to someone new" are one native radio
group, so arrow keys/Space work without custom key handling. `Field` wires
`aria-describedby` to the hint and the error for every input. The success
message goes into an `aria-live` region that's always mounted (a live region
added together with its content often isn't announced). Toggles use
`aria-pressed`. Focus ring is never removed. The daily limit bar is a labelled
`progressbar`.

**Theming (TH1–TH3).** An inline script in `index.html` reads `localStorage` (or
`prefers-color-scheme` on first visit) and sets `data-theme`/`data-segment`
before React loads, so there's no flash. Toggling writes the attribute in the
click handler, so it switches instantly. The customer's `segment` from the API
is the default; an explicit choice overrides it and is remembered. All colours
are token variables; there are no hex values in components or CSS.

**Mobile (D8).** There is one `New transfer` button; below 640 px CSS pins it to
the bottom (above the safe area) instead of rendering a second button. The page
gets bottom padding so the bar never covers the last row. Verified no horizontal
scroll at 360 and 390 px; tap targets are ≥ 44 px.

**Libraries added.** `lucide-react` for icons (tree-shaken, accessible
`aria-hidden` SVGs). Nothing else; the dialog, selects and radios are native.

**What I'd change with more time.** Code-split the transfer dialog
(`React.lazy`) since it isn't needed for first paint. Add a Playwright e2e for
the deployed site. Move the segment switch into one element that CSS
repositions, rather than one in the header and one under the greeting.

## Loading, empty and error states

| State | How it's handled | How to see it on the deployed site |
| --- | --- | --- |
| Dashboard loading | Skeleton matching the final layout, `aria-busy` | Every load (~500 ms), or `?debug` → "Slow (2.5 s)" |
| Dashboard error | `We couldn't load your dashboard.` + `Retry` | `?scenario=error`, or `?debug` → "Errors (500)", then switch back to "Normal" or press Retry |
| No accounts / transactions | Empty-state messages; total shows `SGD 0.00` | `?scenario=empty` or `?debug` → "Empty lists" |
| No search matches | `No transactions match your search.` + `Clear search` | Type `zzz` in the search |
| Payees loading / error / empty | Skeleton rows / inline Retry / "no saved payees" (new recipient still possible) | Open the dialog with the debug scenario set |
| Field errors | Under the field, linked via `aria-describedby`, focus on first invalid | Continue with an empty amount, or more than the balance |
| Over balance / over daily limit | Brief's messages with real amounts | Amount `5000` from checking; or `5001` from savings |
| Send failed | Stay on review, data kept, `role="alert"`, retry | Add `#fail` to the note |
| Sending | `Sending…`, can't press again, can't close | Confirm any transfer |
| Success | `Transfer sent`, amount, recipient, reference; dashboard already refreshed | Complete a transfer |

The debug menu only renders with `?debug`; the scenario only applies to GET
requests and is never set by normal app logic.

## Tests

`npm test` — 20 tests. The integration tests render the whole `<App>` against
the real MSW handlers (data reset before each test) and use the screen the way a
user would: roles, labels and visible text, no component internals.

- **E4.1 Amount over balance** (`TransferDialog.test.tsx`): types 4,280.56,
  presses Continue, asserts the exact message, `aria-invalid`, the
  `aria-describedby` link, focus on the field, still on step 2, and that **no
  POST was made** (via MSW's `request:start` event).
- **E4.2 Successful transfer**: picks Jamie, enters an amount and note, checks
  the review screen, confirms (asserts `Sending…` + `aria-disabled`), sees
  `Transfer sent` + a reference, returns, and checks the dashboard total, the
  remaining limit, the new top transaction row, and that focus is back on
  `New transfer`.
- **E4.3 Dashboard error + Retry** (`Dashboard.test.tsx`): accounts returns 500,
  the error shows, then the override falls through to the real handler and
  Retry loads the dashboard.
- Also: send failure keeps data and retries successfully (T7); new-recipient
  validation focuses the first invalid field; search by category ignoring case,
  no-match state and Clear search; dashboard content (total, credit card, 8
  newest).
- Unit tests for the schema (each amount rule, new-recipient rules,
  `toTransferRequest` sending exactly one of `payeeId`/`recipient`) and for the
  totals/limit helpers.

Money assertions compare against `formatMoney(...)`; `renderApp.tsx` has a
`keepSpaces` normalizer because Testing Library collapses the non-breaking space
that `Intl` puts after `SGD`.

## AI use

<!-- Rewrite this section in your own words before submitting. -->

I used Claude Code (in this repo) to scaffold components, CSS and tests from the
brief, and to run the app in a headless browser to check it. I reviewed
every file and I can explain each decision above. Places where the first
version was wrong and got changed:

- **Discard confirmation never showed.** The first version read
  `form.formState.isDirty` only inside the close handler. React Hook Form's
  `formState` is a proxy that only tracks fields read during render, so it was
  always `false`. Fixed by reading `isDirty` in render.
- **CSS specificity bugs found at 390 px.** The header's segment switch was
  supposed to be hidden on mobile, but `.segment-switch { display: inline-flex }`
  came later in the file with the same specificity, which caused a 26 px
  horizontal scroll. The same problem broke the search input padding. Fixed with
  scoped selectors; checked `scrollWidth` at 360/390 px.
- **Rejected a second mobile "New transfer" button.** The first approach
  rendered a separate fixed button for mobile, which put two identical buttons
  in the accessibility tree. Replaced it with one button that CSS repositions.
- **Tests leaked between cases.** Testing Library only auto-cleans when Vitest
  globals are on (they're off here), so renders piled up. Added `cleanup()` to
  the test setup.

## Not done / known issues

- Optional items not done: balance-hide toggle, third segment, `#transfer` deep
  link, Playwright e2e test. Done: daily-limit progress bar, discard
  confirmation, debug menu, CI workflow.
- Chrome's anti-abuse rule for `<dialog>` lets a second Esc press with no click in
  between close the dialog without the discard prompt. The app handles the
  `close` event so state stays in sync, but the confirmation is skipped in that
  case.
- The segment switch is rendered twice (header on ≥ 640 px, under the greeting
  on mobile), with CSS hiding one.
- Data resets on refresh (expected with the in-memory mock).
- The greeting is always "Good evening", as the brief says.
