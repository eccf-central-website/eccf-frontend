# ECCF Frontend — Next.js Application

> Public website, Sermon Vault & AI Message Finder, Updates hub, Giving Hub, Worker Onboarding, and role-scoped Exco Dashboard for the **Edo State University Christian Campus Fellowship (ECCF)**.

---

## 📌 Project Overview

- **Project Name:** ECCF Central Website & Management Portal — Frontend
- **Framework:** Next.js `14.2.35` (App Router) + React 18 + TypeScript + Tailwind CSS
- **Authentication:** Clerk (`@clerk/nextjs` 5 — Google OAuth & emailed OTP codes; no passwords)
- **Backend Datastore:** [`eccf-backend`](https://github.com/eccf-central-website/eccf-backend) (Sanity Studio v3, private dataset)
- **Sanity Project ID:** `ynnot4j0` (dataset: `production`)
- **Hosting:** Vercel

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up local environment variables
cp .env.example .env.local

# 3. Run development server (http://localhost:3000)
npm run dev

# 4. Run verification gates
npx tsc --noEmit
npm run lint
npm run build
npm run check:encryption

# 5. Run Playwright E2E tests (e.g. --workers=1)
npx playwright test tests/e2e/sermon-ai-search.spec.ts --workers=1
```

---

## 📂 Directory Structure

```text
eccf-frontend/
├── app/
│   ├── (public)/            # /, /about, /sermons, /sermons/[slug], /announcements (nav: Updates), /connect, /give, /register, /privacy, /terms
│   ├── (dashboard)/         # /dashboard/* (overview, executives, workers, attendance, finance, first-timers, welfare, prayer-requests, announcements, minutes, sermons, settings), /login, /sign-up
│   ├── qa/                  # Public 4-digit-PIN QA checklist portal
│   ├── actions/             # All Server Actions — the sole mutation boundary
│   └── api/                 # sermons/finder, preview, exit-preview, sync-sermons, upload-drive, webhooks/announcement
├── components/              # Public sections, AI search cards/modal, forms, and Exco Dashboard UI
├── docs/                    # OPERATIONAL_MANUAL.md, DEVELOPER_GUIDE.md, TESTING_PLAN.md, privacy & key rotation runbooks
├── lib/                     # sanity.ts, queries.ts, encryption.ts, sermonSync.ts, sermonUtils.ts, sermon-ai/*, dashboard/* (access, rbac, mock)
├── tests/e2e/               # 6 Playwright E2E suites (dashboard-shell, executives, meeting-minutes, mobile-smoke, sermon-ai-search, settings)
├── types/                   # Shared TypeScript interfaces mirroring eccf-backend schemas
└── .env.example             # Environment variable template (server tokens, encryption keys, Clerk, Resend, Turnstile, RSS, AI keys)
```

---

## 🔒 Security & Architecture Rules

1. **Private Dataset + Authenticated Reads:** `production` denies anonymous queries even for published documents; every read uses `SANITY_READ_TOKEN` (`lib/sanity.ts`, `useCdn: false`).
2. **Server-Side Mutations Only:** `SANITY_WRITE_TOKEN` lives strictly on the server (`app/actions/*`, `app/api/*`) and is never prefixed with `NEXT_PUBLIC_`.
3. **Field-Level Encryption & Blind Indexes:** Phone numbers, room numbers, and `aiSearchSecret.encryptedApiKey` are encrypted with AES-256-GCM (`enc:v1:...`); deterministic phone and birthday lookups use HMAC-SHA256 blind indexes (`bidx:v1:...`).
4. **Canonical Field Naming:** Operational groups are strictly named `team` (never `unit`), and CSGB board authority is scoped strictly to the 5 CSGB executive offices (`President`, two `Vice Presidents`, `General Secretary`, and `Prayer Coordinator` — excluding assistant positions).
5. **Comprehensive Documentation:** See [docs/OPERATIONAL_MANUAL.md](./docs/OPERATIONAL_MANUAL.md), [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md), and [docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md).

---

## 📄 License

Internal use for Edo State University Christian Campus Fellowship.
