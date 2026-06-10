# Security Specification: Zero-Trust Firestore Security for resumegen

This document serves as the application security blueprint to verify and validate that the custom Firestore secure rules are mathematically absolute.

## 1. Data Invariants
- No user can create a resume document pointing to another user's `user_id`.
- The status field can only be mutated through a dedicated Action workflow ('approve', 'reject') and must be protected from direct client updates unless it's their own document initialization as 'pending'.
- `created_at` or `createdAt` must always match `request.time` exactly.
- Long IDs or field value payloads (greater than boundary limits or invalid characters) must be immediately rejected at the static schema check layer before any read is attempted, protecting against "Denial of Wallet" resource exhaustion.

## 2. The "Dirty Dozen" Hack Payloads
Below are 12 specific hostile payloads/operations designed to test identity theft, state shortcutting, validation gaps, and resource poisoning:

1. **Identity Spoofing - External Owner**: An authenticated attacker attempts to write a resume with `user_id` set to a target victim's UID.
2. **Identity Spoofing - Admin Simulation**: A user tries to set the boolean attribute `isAdmin: true` inside a user document to escalate privileges.
3. **State Shortcutting - Instant Approval**: A client uploads a new draft resume with `status: "approved"` directly, skipping the moderation approval sequence.
4. **State Shortcutting - Multi-Phase Status Jump**: Mutating a terminal state (e.g. approved) back to `pending` directly without an administrator authorization.
5. **Ghost Field Injection (Shadow Update)**: Attempting to update a resume document with an unmodeled field like `isEligible: true`.
6. **Resource Poisoning - Long Field ID**: Attempting to set an excessively long id string (`projectId/resumeId` greater than 128 characters) into a path variable.
7. **Value Poisoning - Winner Invalid Type**: Sending a boolean or numeric type into a field expecting string structures.
8. **Denial of Wallet (DoW) - Payload Bloat**: Attempting to upload a document containing a massive array field with over 1000 items.
9. **Blanket Read Request**: A client attempting to fetch listings without enforcing an owner filtering query (`allow list: if isSignedIn()`).
10. **Temporal Integrity Hack**: Attacking timestamps by sending a backdated `created_at` matching old dates instead of the current server `request.time`.
11. **PII Blanket Leak - Get Profile**: A logged-in, non-admin user trying to `get` the personally identifiable details of another member.
12. **Orphaned Write Attack**: Sublicensing or posting updates to activity logs with a completely fake resume ID that doesn't actually exist in the database.

## 3. High-Security Verification
Every match rule must enforce:
- Authenticators are verified (`request.auth != null`).
- Static validators check format, sizes, types, and properties before querying.
- Immutability metrics check constraints when changes occur.
