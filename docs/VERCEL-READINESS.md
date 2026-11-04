# Vercel readiness and persistent-data migration

Status: **not ready for production deployment yet**.

This document is deliberately conservative: a successful Vercel build is not proof that accounts, sessions, messages, and uploads survive a restart or work across multiple Function instances.

## Current implementation blockers

The current Express application stores mutable runtime state on the local filesystem:

- Main application data and backup: `store.json`, `store.json.bak` under `DATA_DIR`.
- Express sessions: `session-file-store` under `.sessions`.
- User uploads: `multer.diskStorage()` under `uploads/`.
- Generated secrets: `.session-secret`, `.vapid-keys.json`, and `.admin-credentials.json`.

Vercel Functions do not provide a durable shared filesystem for application writes. Using `/tmp` would only be temporary and instance-local. It is not a valid production replacement for the current `DATA_DIR` design.

## Target architecture for a free-tier evaluation

| Concern | Candidate | Notes |
| --- | --- | --- |
| Web application / Express Function | Vercel Hobby | Hobby is intended for personal, non-commercial use and is subject to usage limits. |
| Relational application data | Neon Postgres | Start with explicit relational tables and transactional writes; do not treat one mutable JSON snapshot as safe across concurrent Function instances. |
| Uploads and media | Neon Object Storage or another S3-compatible store | Use object keys in the database, not local file paths. |
| Login sessions | Upstash Redis or a Postgres-backed session store | Session records must be shared across Function instances. |
| Socket.IO fan-out | Redis adapter | Required when clients connected to different Function instances must receive the same events. |

Free-tier limits and eligibility can change. Re-check each provider's terms and usage dashboard before making the application public or relying on it for important data.

## Required migration sequence

1. Introduce a storage interface while keeping the existing file-backed implementation for local development and Docker.
2. Add a Postgres implementation with transaction boundaries for account, message, group, moderation, and administrative mutations.
3. Add a one-time, repeatable import tool for an existing `store.json`; never overwrite a populated database with the blank seed.
4. Replace `session-file-store` with a shared session store.
5. Replace `multer.diskStorage()` with object-storage uploads and persist metadata/object keys in Postgres.
6. Move generated long-lived secrets to stable environment variables or a shared secrets store.
7. Add a Socket.IO adapter and test cross-instance delivery, reconnects, and session revocation.
8. Run migration tests, HTTP tests, browser tests, upload tests, concurrent-write tests, and a restore test before connecting Vercel production deployment.

## Deployment gate

Do not add a production Vercel project or promote a deployment until:

- No production path depends on a writable local `DATA_DIR`.
- Sessions are shared and survive cold starts.
- Messages and account changes are transactionally stored.
- Uploaded media survives redeployments.
- Socket.IO works across separate Function instances.
- A migrated dataset has been verified against its source backup.
- The health endpoint reports the actual state of the external database, session store, and object storage.

The current `work/vercel-hardening` branch only establishes a patched dependency baseline and CI. It does not claim that the persistent-data migration is complete.
