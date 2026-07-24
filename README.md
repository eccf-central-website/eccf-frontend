# ECCF Frontend — Next.js Application

> Public website, Sermon Vault, Giving Hub, and Exco Dashboard portal for the **Edo State University Christian Campus Fellowship (ECCF)**.

---

## 📌 Project Overview
- **Project Name:** ECCF Central Website & Management Portal — Frontend
- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend Datastore:** [`eccf-backend`](https://github.com/eccf-central-website/eccf-backend) (Sanity Studio)
- **Sanity Project ID:** `ynnot4j0`
- **Hosting:** Vercel (Hobby Tier)

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Setup local environment variables
cp .env.example .env.local

# 3. Run development server (http://localhost:3000)
npm run dev

# 4. Run build verification
npm run build

# 5. Run lint check
npm run lint
```

---

## 📂 Directory Structure

```
eccf-frontend/
├── app/
│   ├── layout.tsx          # Root layout (Navbar + Footer + Global Navy Theme)
│   ├── page.tsx            # Public Hero landing page
│   └── globals.css         # Tailwind directives & CSS variables
├── components/
│   └── layout/
│       ├── Navbar.tsx      # Sticky responsive navigation with mobile drawer
│       └── Footer.tsx      # Brand footer with quick links & copyright
├── lib/
│   ├── sanity.ts           # @sanity/client setup (Read-only + Server-Side Write client)
│   └── queries.ts          # GROQ query registry (PII fields excluded from public queries)
├── types/
│   └── index.ts            # Shared TypeScript interfaces mirroring eccf-backend schemas
└── .env.example            # Template for environment secrets
```

---

## 🔒 Security & Architecture Rules

1. **Server-Side Write Client:** `SANITY_WRITE_TOKEN` lives strictly on the server (never prefixed with `NEXT_PUBLIC_`).
2. **PII Masking:** `phoneNumber` and `roomNumber` are stripped from any client-facing API responses.
3. **Canonical Field Naming:** Operational groups are strictly named `team` (never `unit`).
4. **Stateless Tier:** No persistent in-memory state — all durable data reads/writes to Sanity via GROQ.

---

## 📄 License
Internal use for Edo State University Christian Campus Fellowship.
