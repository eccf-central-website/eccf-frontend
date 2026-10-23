# Encryption Key Unification Runbook

## Why this is needed

`ENCRYPTION_KEY` and `HMAC_PEPPER` must be the same in local development and in
Vercel production. When they differ, a value written by one environment cannot
be read by the other. The UI previously showed `[Encrypted Data]` when that
happened.

Run the read-only health check at any time:

```bash
node scripts/check-encryption-health.mjs
```

It reports unreadable fields by document id and field name. It never prints the
decrypted values.

## Recommended approach: one canonical key + legacy keys

Use the production values as the canonical key because production owns the
authoritative records.

1. In Vercel, open **Settings → Environment Variables** and copy the current
   production `ENCRYPTION_KEY` and `HMAC_PEPPER` values to a safe password
   manager. Do not paste them into chat, tickets, or source control.

2. In `.env.local`, set:

   ```dotenv
   ENCRYPTION_KEY=<production ENCRYPTION_KEY>
   HMAC_PEPPER=<production HMAC_PEPPER>
   ENCRYPTION_LEGACY_KEYS=<the old local ENCRYPTION_KEY>
   HMAC_LEGACY_PEPPERS=<the old local HMAC_PEPPER>
   ```

3. In Vercel, add the old local key and pepper to the comma-separated legacy
   variables:

   ```dotenv
   ENCRYPTION_LEGACY_KEYS=<the old local ENCRYPTION_KEY>
   HMAC_LEGACY_PEPPERS=<the old local HMAC_PEPPER>
   ```

   Keep any previously listed legacy values, separated by commas.

4. Redeploy the production app so the new environment variables are loaded.

5. Run the health check locally:

   ```bash
   node scripts/check-encryption-health.mjs
   ```

   Expected result: `Unreadable encrypted fields: 0`.

   If fields are still unreadable, they were probably written by an even older
   build that used hardcoded fallback salts. Add the values that apply to
   `ENCRYPTION_LEGACY_KEYS` (comma-separated) and rerun the check:

   ```dotenv
   ENCRYPTION_LEGACY_KEYS=development_secret_key_eccf_2026,eccf-production-security-salt-2026-key,eccf-production-blind-index-pepper-2026,<old-key>
   HMAC_LEGACY_PEPPERS=development_secret_key_eccf_2026,eccf-production-security-salt-2026-key,eccf-production-blind-index-pepper-2026,<old-pepper>
   ```

   These three values are historical defaults from earlier builds, not secrets.
   They are included only so old records remain readable.

6. Sign in to `/register` and confirm the profile opens without the placeholder.
   Sign in to `/register/status` and confirm room number and birthday are visible.

## Optional cleanup: re-encrypt with the canonical key

Once every environment can read every field, you can rewrite existing records
with the canonical key. Do this only after a fresh database backup and a dry run.
The existing script is `scripts/encrypt-existing-data.mjs`. It is draft-only and
must be reviewed before use. After a successful re-encryption and verification,
remove the legacy key and pepper from both environments.

## Important notes

- Never rotate `ENCRYPTION_KEY` without first adding the old value to
  `ENCRYPTION_LEGACY_KEYS`.
- Never rotate `HMAC_PEPPER` without first adding the old value to
  `HMAC_LEGACY_PEPPERS`. Blind indexes depend on it.
- Do not commit `.env.local` or any file containing the real key values.
- The frontend returns an empty string instead of `[Encrypted Data]`, so a
  missing key no longer leaks a placeholder into the UI, but the affected field
  will be blank until the key is available.
