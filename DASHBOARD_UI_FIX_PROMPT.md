# Task: Fix ECCF Exco Dashboard UI (Desktop + Mobile)

You are working in `eccf-frontend`, a Next.js App Router project.
The dashboard lives in `app/(dashboard)/` with components in
`components/dashboard/`. It is a church-fellowship executive dashboard:
role-gated (RBAC), server-rendered, dark-mode-capable, mobile-first PWA.

## Design direction (2026-10 reference)

The visual target is a **borderless, tonal-elevation dashboard** (see the
SQUIRE-style reference the user shared): dark charcoal/navy canvas, cards
elevated by a subtle background step (`--card` > `--background`) — never
by visible outlines. One blue accent, big numeric focal points with
`tabular-nums`, generous radius, quiet muted-foreground labels. Rules:

- **No default borders/shadows-as-lines.** Cards separate from the
  canvas with tonal contrast + a whisper of `shadow-sm`. Kill
  `border-b`/`border-r`/`border-t` chrome lines on header, sidebar,
  bottom nav, cards and section headings (already done in the shell);
  tables may keep *faint* row hairlines (`divide-border/50`) for
  scanability.
- **Don't reintroduce `border-*` utilities** when adding components.
- Status colour appears as a light tint (`bg-success/10 text-success`),
  not a solid block.


## Hard constraints — do NOT regress these

The current UI gets these right. Preserve them exactly:

- **Streaming architecture.** Every page header renders immediately; each
  data block sits behind its own `<Suspense>` + `BlockErrorBoundary`
  (`app/(dashboard)/dashboard/page.tsx`). Skeletons are sized to the
  role's card count via `OverviewStatsSkeleton` / roles passed to the
  layout. Do not convert to client fetching.
- **RBAC.** Cards, links, and nav items appear only for roles with
  permission (`hasPermission`, `canAccessSection`, `SECTION_PATHS`).
- **Server Components.** `StatCard` etc. render icons server-side; only
  shell pieces are `'use client'`. Keep new components server where
  possible.
- **Accessibility wins.** Skip link; `<data value>` on figures; `aria-label`
  on icon-only buttons; `aria-current="page"` nav; heading order
  h1 (TopBar) → h2 (page) → h3 (group) → h4 (card); stretched link on
  StatCard (`after:absolute after:inset-0`); `<time dateTime>` with
  `title` tooltips; status meaning always in words, never colour alone.
- **Token system.** All colors come from `app/(dashboard)/dashboard.css`
  HSL tokens consumed via Tailwind (`bg-primary`, `text-muted-foreground`,
  `--success`, `--warning`, etc.). See "Theming" tasks below — the goal is
  100% of dashboard UI on tokens.
- **Two Tailwind configs.** Dashboard compiles from
  `tailwind.dashboard.config.ts`; public pages use `tailwind.config.ts`.
  Keep dashboard classes inside the dashboard config's content globs.

---

## P0 — Token & dark-mode violations (breaks dark mode today)

### 1. Hardcoded CTA button on the overview
`app/(dashboard)/dashboard/page.tsx:80`

Current:
```
bg-[#0077cc] hover:bg-[#0060aa] text-white font-bold text-xs gap-1.5 + mr-1
```

Fix:
- Replace hardcoded hex with tokens: `bg-primary text-primary-foreground
  hover:bg-primary/90 transition-colors` — or better, use the shared
  `<Button>` component (`components/dashboard/ui/button.tsx`,
  size as appropriate, `asChild` + `<Link>`).
- Remove the double spacing on the icon (`gap-1.5` on the link already
  provides it — drop the `mr-1`).
- Raise type size to `text-sm font-semibold`; `text-xs bold` reads
  defensive, not styled.
- Fix copy per guidelines: label with a specific verb, Title Case —
  "Mail Workers" / "Broadcast to Workers" rather than
  "Broadcast Mail to Workers" if space-constrained.

### 2. Off-token palette in the finance table
`components/dashboard/finance/FinanceTable.tsx` (both the mobile cards
and desktop table paths)

Current: hardcoded `bg-emerald-50 text-emerald-700 border-emerald-200`,
`bg-rose-50 text-rose-700 border-rose-200`, `text-sky-600`, and
`text-[11px]` — light-theme-only colors that glare on dark surfaces and
low-contrast (`--destructive`/`--success` tokens already exist for this).

Fix (both mobile-card and desktop-table render paths, or better: hoist
this into one shared row component so the two paths can't drift):
- Income badge/amount: `bg-success/15 text-success border-success/25`
  (define the tint with the `--success` token, verify AA in both themes).
- Expense badge/amount: same pattern with `--destructive`.
- Flutterwave ref: `text-accent-foreground` or `text-primary` + `font-mono
  text-xs` — no bare `sky-600`, no `text-[11px]` (11px is below legible
  minimum; use the `text-xs` utility only).
- Amounts: use the existing `formatNaira()` helper
  (`lib/dashboard/format`) in BOTH paths (the mobile card currently does
  `₦{entry.amount.toLocaleString()}`) so money formatting is identical
  across stat cards and table, and backed by `Intl.NumberFormat`.
- Add `tabular-nums` to the amount cell and the mobile amount (and see
  P1 StatCard task for the stat figures).
- `truncate` on description needs a `title` attribute.

### 3. Static `themeColor` + missing `color-scheme`
`app/layout.tsx:40` sets `themeColor: "#0077cc"` (light brand blue) while
the dark theme's chrome is `hsl(25 5% 13%)`.

Fix:
- Move `themeColor` into a `viewport` export with both values and a
  media query:
  ```ts
  export const viewport: Viewport = {
    themeColor: [
      { media: '(prefers-color-scheme: dark)', color: '#21201f' },
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    ],
  }
  ```
- Add `color-scheme: light` on `:root` and `color-scheme: dark` on `.dark`
  in `app/(dashboard)/dashboard.css` so native scrollbars, form controls,
  and text selection stop rendering light-modal in dark mode. (If the
  ThemeProvider can set `style="color-scheme"` on `<html>` when the class
  toggles, do that instead/additionally so it follows the manual toggle
  from the start.)

---

## P1 — Layout & hierarchy (desktop)

### 4. Badge soup in the overview greeting
`app/(dashboard)/dashboard/page.tsx:52–72`

The welcome row carries: h2 greeting + excoPosition pill + role Badge +
up to 2 team Badges, in one `flex-wrap` row. Arbitrary wrap points;
team badges `hidden sm:inline-flex` vanish at phone widths; role badge
duplicates the UserMenu.

Fix:
- Structure the header as **two stacked lines**, not a wrap row:
  1. One identity badge only (excoPosition if present, else role label)
     directly after the greeting — this stays visible at every width.
  2. Metadata line under the subtitle: team/teams shown as quiet
     `text-muted-foreground` text ("Media · Prayer teams"), removing the
     `hidden sm:` class trick entirely — same info at all widths.
- Drop the role badge from the page header (it already lives in
  UserMenu); keep excoPosition since it's not shown elsewhere at a glance.

### 5. Orphaned stat cards
`components/dashboard/overview/OverviewStats.tsx:78`

Grid is `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, but People has 5
cards (one orphan at full width on xl) and Finance has 3 (dead slot on
xl).

Fix:
- People (5 cards, xl): give the 5th card
  (`stat-last-service`) `xl:col-span-2` so rows run 4+2; at `sm` keep
  2-col but give it `sm:col-span-2` for rows 2+2+1... choose the span
  that avoids any single-card full-row.
- Finance (3 cards, xl): make the Net card `xl:col-span-2` (rows: 2+2
  wait — 3 cards over 4 cols → give Net `xl:col-span-2` yields
  income+expense / net(2wide)). Alternative: `xl:grid-cols-3` for the
  Finance group specifically, with skeleton matching. Pick and apply the
  SAME spans in `OverviewStatsSkeleton` / `StatGridSkeleton` so nothing
  jumps when cards stream in.
- Also verify at the `lg` two-col breakpoint there is no orphan; add
  `lg:col-span-*` equivalents if needed.

### 6. `tabular-nums` on figures
`components/dashboard/overview/StatCard.tsx:89`

Add `tabular-nums` to the big number `<p>` / `<data>` so multi-digit
amounts keep constant advance width. Also spread it via the finance table
task above.

### 7. Redundant stacked titles
On `/dashboard`, TopBar h1 renders the section title "Overview" and the
page immediately h2s "Welcome back, {name}". Fix: in the dashboard
section, when the page provides its own greeting/heading, suppress the
TopBar title on the overview (the TopBar already special-cases
`section === 'overview'` — render nothing or just a compact wordmark
there, keeping the h1 on the page's "Welcome back" so heading order still
starts at h1). Confirm every other section keeps its one TopBar h1.

---

## P2 — Mobile layout fixes

### 8. Double bottom compensation above the BottomNav
`app/(dashboard)/dashboard/layout.tsx:79` gives the scroll container
`pb-20 sm:pb-0`, AND `components/dashboard/shell/BottomNav.tsx:126`
renders an extra spacer:
```
<div className="h-14 shrink-0 sm:hidden" ... style={{height: 'calc(3.5rem + env(safe-area-inset-bottom))'}} />
```
Both exist to clear the same fixed bottom nav. Result: a band of dead
space at the bottom of every phone screen.

Fix: keep ONE mechanism. Recommended: keep the spacer inside BottomNav
(as a fragment sibling, exactly the nav's height incl. safe-area) and
change `main` to `pb-0`... then in-page floats/popovers need clearance —
so simplest is the reverse: keep `pb-20` on main and DELETE the
BottomNav spacer div + `aria-hidden` wrapper. Either way, verify:
- FAB-less content bottom-scrolls flush above the nav,
- floating panels (Select/Dialog portals) aren't hidden behind the nav.

### 9. Stat-card scroll depth on phones
`OverviewStats.tsx` groups render `grid-cols-1` on mobile: 8 tall cards
(≈120px each with p-4, icon row, 2xl figure, caption, link) ≈ 1000px
before the activity lists.

Fix: make StatCards horizontally compact at mobile width —
`grid-cols-2` from the base breakpoint with a tighter mobile padding
(`p-3`), smaller figure (`text-xl` at base), and the link row hidden on
base (the stretched-link overlay stays as the tap target; the visible
"View first-timers" text can hide under `sm:`). Keep the
`after:absolute` overlay so the smaller card is still one tap target.
Update `StatGridSkeleton`/`StatCardSkeleton` to the same compact sizing
so the skeleton height matches exactly (no streaming jump).

### 10. Theme toggle in three places
`MobileNav.tsx:54`, `BottomNav.tsx:113`, `UserMenu.tsx` all render
theme-toggle handlers. Pick exactly two: (a) UserMenu — it's one tap
everywhere the dropdown exists; (b) BottomNav "More" sheet — phones rely
there. Remove the toggle from the MobileNav (Tablet) sheet.

### 11. TopBar spacing & tap targets
`components/dashboard/shell/TopBar.tsx`:
- Find out what sizes InstallPwaButton and UserMenu render at on mobile. If they're under the comfortable 40px spot height, bump them for phones only.
- Reduce the right cluster density on phones: hide the PWA install button once it's dismissed (should already be managed), and if the cluster exceeds ~44px/pixel density, only keep the avatar visible at base.
- Overflow safety: keep `truncate` on the title (already there) and confirm horizontal overflow is impossible at 320px width with both icons.

And the Right cluster ordering task from P1 remains: keep the layout `h-12 sm:h-14 lg:h-16` unless this forces changes.

---

## P3 — Polish (do after P0–P2 pass)

- StatCard stretched-link overlay makes the caption/date unselectable on
  desktop; home-grown tooltip `title` requires hover. Fine as-is, but if
  a tooltip utility (`components/dashboard/ui/tooltip.tsx`) makes the date
  discoverable on touch, use it only for the RelativeTime in
  `ActivityList.tsx:52` — nothing else.
- Add `touch-action: manipulation` to the BottomNav primary links and the
  mobile stat-card links (prevents 300ms double-tap zoom).
- `overscroll-behavior: contain` on the navigation Sheets
  (`MobileNav.tsx` left sheet, `BottomNav.tsx` bottom sheet classes).
- Finance desktop table: add `min-w` on the Amount column so numbers
  never squeeze, and check the whole table inherits `tabular-nums`.
- Copy pass: `font-serif` headings are fine, but per guidelines set
  `text-balance` (`text-balance`/`text-pretty`) on "Welcome back…" and
  `Heading` in StatCard.

## Definition of done

1. `grep -rn "bg-\[#\|text-\[#" app/(dashboard) components/dashboard`
   returns zero hardcoded-hex/self-crafted color utilities in dashboard
   code (font-size brackets like `text-[11px]` are also gone).
2. Dark mode: finance table, overview CTA, badges all meet AA on the
   `.dark` palette; `color-scheme` and dynamic `themeColor` active.
3. Desktop 1440px: no orphan stat card, no dead grid slot, single title
   on the overview, CTA uses the shared Button.
4. Mobile 375px: single bottom-padding mechanism, stat cards 2-up and
   compact, activity lists reachable in < 2 screens, theme reachable in
   ≤ 2 taps, no unintended horizontal scroll at 320px.
5. All skeletons match the new layouts exactly (no jump when blocks
   stream). `pnpm build` passes and Playwright QA still green.

Return a summary listing each change with its file, plus a screenshot
walkthrough at 1440px and 375px widths if a dev server is available
(`pnpm dev`, mock auth per the project's DevSwitcher).
