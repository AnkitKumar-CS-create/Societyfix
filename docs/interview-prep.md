# SocietyFix Interview Preparation Guide

This document explains the project in interview language. Read the short answer sections first, then use the deeper sections to understand how the code works.

## 1. Thirty-second project explanation

SocietyFix is a full-stack apartment maintenance tracker. Residents create accounts, log in, submit maintenance complaints with categories and optional photos, and track status history. Admins see all complaints, filter them, set priority, add progress or solution notes, update status, publish society-wide notices, and view dashboard analytics. The application uses React and TypeScript on the frontend, Express and TypeScript on the backend, Prisma with PostgreSQL for persistence, JWT and bcrypt for authentication, and Resend for optional email notifications.

The most important design decision is separating private complaint communication from public notices. A complaint contains its own status history and private conversation, while the notice board is used for announcements intended for residents generally.

## 2. How to run the project

Prerequisites:

- Node.js and npm
- PostgreSQL, or a hosted PostgreSQL database such as Neon
- Git

Clone the project and configure environment files:

```bash
git clone https://github.com/AnkitKumar-CS-create/Societyfix.git
cd Societyfix
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set `DATABASE_URL` and a strong `JWT_SECRET` in `backend/.env`. The backend uses port `5001` by default because port `5000` is commonly occupied on macOS. Prepare and seed the database:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_BACKEND_URL=http://localhost:5001/api` from `frontend/.env`.

Seeded account:

- Admin: `admin@societyfix.demo` / `Admin@123`

Public registration creates resident accounts only. An admin role is not selectable during registration.

## 3. Architecture

The project has three main layers:

```text
React frontend
    |
    | Axios HTTP requests with JWT Authorization header
    v
Express backend API
    |
    | Controllers, middleware, services
    v
Prisma ORM
    |
    v
PostgreSQL database
```

### Frontend

The frontend is a Vite React application. `App.tsx` defines routes and protects application pages with `ProtectedRoute`. `AuthContext.tsx` stores the current user and login state. `services/api.ts` creates the Axios client and attaches the JWT from `localStorage` to protected requests.

Important pages:

- `Login.tsx`: login and resident registration
- `Dashboard.tsx`: metrics and category chart
- `Complaints.tsx`: search, filters, priorities, and complaint list
- `NewComplaint.tsx`: complaint form and photo preview
- `ComplaintDetail.tsx`: history, solution notes, photos, and conversation
- `Notices.tsx`: admin announcements and resident notice feed

### Backend

The backend starts from `server.ts` and mounts the Express application. `app.ts` registers middleware and routes. Controllers handle HTTP requests, services handle reusable integrations such as email, and middleware handles authentication and authorization.

Important routes:

- `/api/auth`: registration, login, current profile
- `/api/complaints`: create, list, view, status, priority, comments
- `/api/notices`: view, create, delete
- `/api/admin/dashboard`: admin analytics

## 4. Authentication and authorization

During registration, the API validates the name, email format, and password length. The password is hashed with bcrypt before it is stored. The plain password is never stored in the database and never returned in an API response.

During login:

1. The API normalizes the email to lowercase.
2. It finds the user by unique email.
3. It compares the submitted password with the bcrypt hash.
4. It signs a JWT containing the user ID and role.
5. The frontend stores the token and user information.
6. Axios sends the token on later requests as `Authorization: Bearer <token>`.

`requireAuth` verifies the JWT. `requireAdmin` checks that the token role is `ADMIN`. Residents can only access their own complaints. Public registration always defaults to `RESIDENT`, which prevents someone from selecting admin privileges from the signup form.

A good interview sentence is: “Authentication proves who the user is; authorization decides what that user is allowed to do.”

## 5. Complaint lifecycle

The complaint lifecycle is:

```text
OPEN -> IN_PROGRESS -> RESOLVED
```

A resident creates a complaint with a title, description, category, and optional photo. The API creates the complaint and its first history record in one database transaction. This guarantees that a complaint cannot exist without its initial audit entry.

An admin can set priority to Low, Medium, or High and update status. Every status change creates a `ComplaintHistory` record containing:

- Complaint ID
- Previous status
- New status
- Actor ID
- Optional note describing the action or solution
- Timestamp

Once a complaint is resolved, the API prevents further status changes. The latest note is shown as the solution or progress update, while the complete history remains visible in the timeline. Residents and admins can also exchange private comments attached to the complaint.

## 6. Database design

The central models are:

- `User`: identity, email, password hash, role, apartment, and block
- `Complaint`: current issue state, category, priority, photo, resident, and timestamps
- `ComplaintHistory`: immutable status transition audit records
- `ComplaintComment`: private conversation messages attached to a complaint
- `Notice`: society-wide announcement created by an admin
- `Notification`: in-app notification for a user

The relationships are intentional. A user owns many complaints, a complaint has many history records and comments, and each history record or comment has an author. Foreign keys preserve referential integrity.

The comments feature is introduced through a Prisma migration named `20260824000000_add_complaint_comments`. Schema changes should be applied with migrations rather than changing the production database manually.

## 7. Overdue detection

Overdue status is calculated dynamically from `COMPLAINT_OVERDUE_DAYS`. Active complaints older than the configured threshold are overdue. Resolved complaints are never overdue.

This is better than storing a permanent boolean because a configuration change immediately affects calculations and there is no stale flag to repair. The API adds `isOverdue` to responses, puts overdue complaints first, and includes the count in admin dashboard analytics.

## 8. Notices and notifications

Notices are broadcast communication. Any authenticated resident or admin can read them, but only admins can create or delete them. Important notices are pinned at the top and trigger email delivery to residents.

Complaint comments and solution notes are private to the complaint. When an admin replies to a resident’s complaint, the API creates an in-app notification for that resident. When an admin changes complaint status, the email service sends a status update. Resend is optional in development; without an API key, the service logs a mock email instead.

## 9. Photo handling

The complaint form accepts an image file, checks that it is an image, enforces a five-megabyte limit, and displays a preview. The current implementation sends the image through the existing `photoUrl` field as a data URL. This is suitable for demonstrating the workflow but is not the ideal production storage design.

For production, I would upload the file to Cloudinary, S3, or Azure Blob Storage and store only the resulting HTTPS URL in PostgreSQL. This keeps the database small and makes image delivery more efficient.

## 10. What to demonstrate in an interview

1. Register a new resident account.
2. Log in and show that the account is a resident.
3. Create a complaint with a category, description, and photo.
4. Open the complaint and show its initial history entry.
5. Log in as admin.
6. Filter complaints by status or category.
7. Change priority and status, adding a solution note.
8. Return to the complaint as a resident and show the solution note and timeline.
9. Add a private conversation reply.
10. Create an important notice as admin and show it in the resident notice feed.
11. Open the dashboard and click a metric to navigate to filtered complaints.

## 11. Common interview questions and answers

### Why did you use Prisma?

Prisma gives the TypeScript backend type-safe database access, readable schema definitions, migrations, and generated client code. It reduces SQL mistakes while keeping relationships explicit.

### Why use transactions?

Complaint creation and status updates change multiple related records. Transactions ensure the complaint and its history stay consistent. If one operation fails, the database rolls back the entire operation.

### Why use JWT?

JWT provides stateless API authentication. The server can validate a signed token on each request without storing a session in memory. In a larger production system, I would also consider short-lived access tokens and refresh tokens.

### How do you protect admin routes?

The request first passes through `requireAuth`, which verifies the token. It then passes through `requireAdmin`, which checks the role from the verified request user. The frontend hides admin controls for usability, but the backend authorization is the real security boundary.

### Why are notices different from comments?

A notice is a broadcast to the community. A comment is private communication about one complaint. Combining them would expose private resident discussions to everyone.

### How would you improve overdue handling?

I would add priority-based SLA thresholds, for example 24 hours for high priority, three days for medium priority, and seven days for low priority. I would also record assignment and response timestamps to calculate admin response time.

### What would you improve before production?

I would add email ownership verification, password reset, rate limiting, stronger request validation, structured logging, secure HTTP-only cookies or a carefully designed token strategy, object storage for photos, background jobs for email, and automated tests.

### What was a difficult issue?

A useful example is the authentication integration issue: login itself was successful, but later protected requests returned 401 because the Axios client did not attach the JWT. Adding a request interceptor fixed the actual cause instead of changing authorization rules.

## 12. Honest limitations

Do not claim features that are not fully implemented:

- Email format is validated, but ownership verification links are not implemented.
- Resend email delivery requires production environment variables; otherwise emails are mocked in logs.
- Photo upload currently uses data URLs; production should use object storage.
- Assignment to maintenance staff, polls, amenity booking, and payment tracking are future features.
- Automated unit and end-to-end test coverage should be expanded.

Being clear about limitations is stronger in an interview than pretending the prototype is production-ready.

## 13. Final answer to memorize

“SocietyFix is a role-based maintenance management platform. Residents submit and track complaints, while admins manage priority, status, overdue work, notices, and solutions. The backend uses Express, Prisma, PostgreSQL, bcrypt, and JWT. The frontend uses React, TypeScript, Vite, Tailwind, Axios, and Recharts. I modelled complaint history separately so every status change has an actor, timestamp, old status, new status, and note. I also separated private complaint conversations from public society notices. For production, I would move photos to object storage, add email verification and password reset, use background jobs for notifications, and add broader automated testing.”
