# ECCF Google Apps Script — Image Upload Bridge to Google Drive

This Google Apps Script service powers the **Zero-Fixed-Infrastructure-Cost** image storage architecture specified in the **ECCF Central Website System Design Document (SDD §4.6, §5.2, §6.4, §7.1)**.

---

## 🏛️ Architecture Overview

```
[ Client Browser ]
        │
        ▼ 1. Image selected & compressed via Canvas (Max 1200px, ~200KB Base64)
[ FileReader / Base64 Converter ]
        │
        ▼ 2. POST { base64, cleanFileName: "${fullName}_${team}_BirthdayPic.jpg" }
[ Next.js API Proxy / Webhook Bridge ]
        │
        ▼ 3. Google Apps Script Web App (V8 Engine)
[ Google Apps Script doPost(e) ]
        │
        ▼ 4. Utilities.base64Decode() -> Google Drive Folder ("ECCF Workforce Birthday Photos")
[ Public CDN Direct Link ]
  --> Returns: https://lh3.googleusercontent.com/d/{fileId}
        │
        ▼ 5. Next.js Server Action saves `profileImageUrl` to Sanity.io datastore
```

### Key Advantages
1. **Zero Recurring Storage Cost:** Stores high-resolution worker and birthday portraits directly on Google Drive using Google Workspace / Free Gmail storage.
2. **Bypasses Vercel Serverless Limits:** Vercel functions have a strict 4.5MB request payload limit. By processing and uploading directly to Google Drive, the Next.js Server Action only receives a lightweight text URL string.
3. **High-Speed Direct CDN Links:** Returns `https://lh3.googleusercontent.com/d/{fileId}` links which bypass Google Drive viewer wrappers and display instantly in HTML `<img>` tags and the Exco Dashboard.

---

## 🚀 Deployment Instructions (2 Minutes)

### Step 1: Open Google Apps Script
1. Go to [https://script.google.com/](https://script.google.com/) and sign in with the church's Google account (e.g., `eccf.media@gmail.com` or executive account).
2. Click **+ New Project** in the upper left.
3. Rename the project from "Untitled project" to **"ECCF Image Upload Bridge"**.

### Step 2: Paste the Code
1. Replace all code in `Code.gs` with the contents of [`Code.gs`](./Code.gs).
2. (Optional) If you have a specific Google Drive Folder you want to store images in:
   - Click the **Gear icon (Project Settings)** on the left sidebar.
   - Scroll to **Script Properties** -> Click **Add script property**.
   - Property: `DRIVE_FOLDER_ID`
   - Value: `<Your Google Drive Folder ID from URL>`
   - *Note:* If you skip this, the script will automatically create a folder named `"ECCF Workforce Birthday Photos"` in your Google Drive on first upload!

### Step 3: Deploy as Web App
1. Click the blue **Deploy** button in the top right -> Choose **New deployment**.
2. Click the **Gear icon (Select type)** next to "Select type" -> Choose **Web app**.
3. Configure the deployment settings:
   - **Description:** `Production ECCF Image Upload Bridge`
   - **Execute as:** `Me (your-email@gmail.com)` *(Crucial: allows the script to write to Drive on your behalf)*
   - **Who has access:** `Anyone` *(Crucial: allows unauthenticated POSTs from the website)*
4. Click **Deploy**.
5. When prompted, click **Authorize access**, choose your Google account, click **Advanced** -> **Go to ECCF Image Upload Bridge (unsafe)** -> Click **Allow**.
6. Copy the **Web App URL** provided (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Add to Environment Variables
1. In your local development `.env.local` file, add:
   ```env
   GOOGLE_APPS_SCRIPT_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
   ```
2. In the **Vercel Dashboard** (Settings -> Environment Variables), add `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` and `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEBHOOK_URL` to **Production** and **Preview** environments.

---

## 🧪 Verification & Health Check

Open your Web App URL in your browser:
```
https://script.google.com/macros/s/AKfycb.../exec
```
You should see:
```json
{
  "ok": true,
  "status": "online",
  "service": "ECCF Google Drive Image Upload Bridge",
  "timestamp": "..."
}
```
If you see this, the bridge is ready and live!
