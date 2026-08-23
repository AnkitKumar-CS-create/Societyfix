# SocietyFix

SocietyFix is a maintenance tracker for apartment communities. Residents register with their own email, raise complaints with optional photos, and follow every status change. Admins manage priorities, statuses, overdue work, notices, and resident notifications.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Authentication: JWT and bcrypt
- Email: Resend (optional; mock logging is used without an API key)

## Local setup

### 1. Configure the database

Copy `.env.example` to `.env` at the project root and set `DATABASE_URL`. The backend also reads `backend/.env`, so place the same database values there or run the backend with the root environment loaded.

Set a strong `JWT_SECRET`, `COMPLAINT_OVERDUE_DAYS`, and optional Resend values:

```env
JWT_SECRET=replace-with-a-long-random-secret
COMPLAINT_OVERDUE_DAYS=3
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=SocietyFix <noreply@example.com>
```

### 2. Install dependencies

```bash
cd backend && npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

cd ../frontend && npm install
```

### 3. Start the applications

The default backend port is `5001` because macOS commonly reserves port `5000` for Control Center.

```bash
cd backend
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal. The frontend API URL is configured in `frontend/.env` as `VITE_BACKEND_URL=http://localhost:5001/api`.

## Product behavior

- Public sign-up creates resident accounts only. Admin access is never selectable during registration.
- Email format, required name, duplicate email, and minimum eight-character password checks are enforced by the API.
- Complaint statuses are `OPEN`, `IN_PROGRESS`, and `RESOLVED`; resolved complaints cannot be changed.
- Admin complaint results support status, category, and date filters. Overdue active complaints are surfaced first.
- Important notices are pinned and trigger resident email notifications.
- Status changes create history records and trigger a resident email.
- Photos are checked in the browser and stored through the complaint photo field. For production, configure Cloudinary or object storage rather than storing data URLs.

## API summary

| Method | Endpoint                       | Access        | Purpose                                |
| ------ | ------------------------------ | ------------- | -------------------------------------- |
| POST   | `/api/auth/register`           | Public        | Create a resident account              |
| POST   | `/api/auth/login`              | Public        | Log in and receive a JWT               |
| GET    | `/api/auth/me`                 | Authenticated | Read the current profile               |
| GET    | `/api/complaints`              | Authenticated | List complaints and apply filters      |
| POST   | `/api/complaints`              | Resident      | Create a complaint                     |
| GET    | `/api/complaints/:id`          | Authenticated | Read a complaint and its history       |
| PATCH  | `/api/complaints/:id/status`   | Admin         | Change status and add a history note   |
| PATCH  | `/api/complaints/:id/priority` | Admin         | Change priority                        |
| GET    | `/api/admin/dashboard`         | Admin         | Read status/category/overdue analytics |
| GET    | `/api/notices`                 | Authenticated | Read notices                           |
| POST   | `/api/notices`                 | Admin         | Publish a notice                       |
| DELETE | `/api/notices/:id`             | Admin         | Delete a notice                        |

## Verification

```bash
cd frontend
npm run build
```

The full system design is documented in [docs/system-design.md](docs/system-design.md).
