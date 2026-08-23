# SocietyFix System Design

SocietyFix separates the resident experience from administrative operations while keeping the complaint lifecycle explicit and auditable. The React frontend communicates with an Express API through Axios. The API authenticates users with JWTs, authorizes requests through resident and admin middleware, and uses Prisma to persist data in PostgreSQL.

## Complaint history model

A complaint stores its current `status`, `priority`, resident, description, optional photo, creation time, and resolution time. Every state transition also creates a `ComplaintHistory` row containing the complaint ID, previous status, new status, actor ID, note, and timestamp. The first history row records the resident opening the complaint. Later rows record admin changes. This gives the UI a chronological timeline and provides an audit trail independent of the current complaint state. Statuses are deliberately constrained to `OPEN`, `IN_PROGRESS`, and `RESOLVED`; the API rejects changes to an already resolved complaint.

Complaint creation writes the complaint and its first history row in one Prisma transaction. Status updates similarly write the new complaint state and history record in one transaction, so the timeline cannot drift away from the current state. Residents can only list and view their own complaints. Admin middleware protects management operations.

## Overdue detection

Overdue status is derived rather than stored, preventing stale flags. The API reads `COMPLAINT_OVERDUE_DAYS` from the environment, defaults to three days, and compares the complaint creation time with the current time. Resolved complaints are never overdue. Active overdue complaints are returned first in the admin list and counted in dashboard analytics. Changing the environment threshold changes future calculations without a data migration.

## Photo handling

The complaint form accepts an image file, checks its MIME type and a five-megabyte size limit, and previews it before submission. The current database field is `photoUrl`, which allows the API and detail view to carry the supporting image. This keeps the local implementation simple and preserves the API contract. A production deployment should replace data-URL storage with Cloudinary, S3, or Azure Blob Storage: upload the file, store the resulting HTTPS URL, and apply access and retention policies at the storage layer.

## Notification flow

When an admin changes a complaint status, the API commits the transaction first, loads the resident email, and triggers a status update through Resend. Important notices are published by admins, pinned in the notice query, and broadcast to resident email addresses. Email delivery is intentionally fire-and-forget from the HTTP response path so a mail provider outage does not roll back a valid complaint update. Without a Resend key, development mode logs the intended message rather than failing silently.

## Security and roles

Passwords are hashed with bcrypt and never returned by the API. Public registration always creates a `RESIDENT`; admin promotion must happen through trusted database or administrative operations. JWTs carry the user ID and role and are attached to protected frontend requests by an Axios interceptor. Production deployments should use a long random JWT secret, HTTPS, rate limiting, email ownership verification, password reset tokens, and external object storage.
