# Operational data privacy boundary

Operational records stay in the existing Sanity dataset to avoid a paid dataset. The application stores new worker, attendance, finance, first-timer, welfare, prayer, and subscriber records as unpublished drafts. Server reads use the authenticated `drafts` perspective; public pages use the unauthenticated `published` perspective. The Studio removes the ordinary Publish action for these document types.

## Rollout

1. Set `SANITY_READ_TOKEN` to a server-only Sanity token with read access. Keep `SANITY_WRITE_TOKEN` server-only and use it only for server mutations and the migration. Do not add either value to a `NEXT_PUBLIC_` variable.
2. Deploy the backend Studio schema change so operational document types no longer offer Publish.
3. Deploy the frontend with `SANITY_READ_TOKEN`, `SANITY_WRITE_TOKEN`, `ENCRYPTION_KEY`, `HMAC_PEPPER`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `SANITY_WEBHOOK_SECRET`, and the free Cloudflare Turnstile site and secret keys configured. Keep legacy keys only during a deliberate key rotation.
4. Run `node scripts/migrate-operational-records-to-drafts.mjs` with the production Sanity project and dataset selected. This is a dry run and reports counts only.
5. Review the counts and then run `node scripts/migrate-operational-records-to-drafts.mjs --execute`. The script copies each published record to a draft and removes its published copy in one Sanity transaction. It skips any record that already has a draft and reports only counts. Resolve skipped records and rerun until no published operational records remain.
6. Verify that an anonymous `published` perspective query returns zero documents for those operational types, while authenticated dashboard reads still work through `SANITY_READ_TOKEN`.
7. Run `node scripts/encrypt-existing-data.mjs` as a dry run and review counts. Add `--execute` only after `migrate-operational-records-to-drafts.mjs --execute` has completed; this script refuses to patch operational records that do not yet exist as drafts.

The migration script is idempotent for records it has already moved. It deliberately leaves a published record untouched if a draft with the same ID already exists, so a human can resolve the two versions without the migration choosing one silently.

## Limits

This boundary protects document records from anonymous Sanity queries. Google Drive profile photos remain anyone-with-the-link because the current app renders direct image URLs. The Apps Script deployment must also be updated with `UPLOAD_HMAC_SECRET` and `DRIVE_FOLDER_ID`; those settings are not in the repository. Private photo delivery would require a server proxy or a storage system with authenticated reads.
