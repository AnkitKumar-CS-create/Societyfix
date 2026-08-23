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

Copy `.env.example` to `backend/.env` and set `DATABASE_URL`. Prisma and the backend load environment variables from the backend project directory.

Set a strong `JWT_SECRET`, `COMPLAINT_OVERDUE_DAYS`, and optional Resend values:

```env
JWT_SECRET=replace-with-a-long-random-secret
COMPLAINT_OVERDUE_DAYS=3
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=SocietyFix <noreply@example.com>
```

Copy `frontend/.env.example` to `frontend/.env` if the backend is not running on the default port.

### 2. Install dependencies

```bash
cd backend && npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

cd ../frontend && npm install
```

### 3. Start the applications

The default backend port is `5001`. You can change it with `PORT`; this avoids a common local port conflict on macOS but is not platform-specific.

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

## Deployment

The frontend and backend can both be deployed as separate Vercel projects on the free Hobby plan. The backend is a Vercel serverless Express function in `backend/api/[...route].ts`; it does not need a long-running Node server.

### Deploy the backend to Vercel

1. In Vercel, import this GitHub repository.
2. Set the project root directory to `backend`.
3. Keep the framework as **Other**.
4. Vercel will use `backend/vercel.json` and the `api/[...route].ts` function.
5. Add the backend environment variables below.
6. Deploy and test `https://your-backend.vercel.app/api/health`.

If Vercel asks for an output directory such as `public`, the project root is configured incorrectly. Set **Root Directory** to `backend`, leave **Output Directory** empty, and redeploy. The backend is a serverless API and does not produce a static `public` folder.

The backend deployment runs `npx prisma generate`. Run `npx prisma migrate deploy` once against the production database before first use, from a trusted local terminal with the production `DATABASE_URL`.

Backend environment variables:

```env
DATABASE_URL=your-production-postgresql-url
JWT_SECRET=your-long-random-secret
PORT=5001
COMPLAINT_OVERDUE_DAYS=3
RESEND_API_KEY=your-resend-key
EMAIL_FROM=SocietyFix <noreply@your-domain.com>
```

### Deploy the frontend to Vercel

1. Create a second Vercel project from the same repository.
2. Set the project root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the frontend environment variable below, using your deployed backend URL.
6. Deploy.

Frontend environment variable:

```env
VITE_BACKEND_URL=https://your-backend-host.example.com/api
```

Do not upload `.env` files, database credentials, or API keys to GitHub. Vercel injects environment variables into the deployed function at runtime.

## Submission package

The source package should include the application source, Prisma migrations, README, API documentation, system design, and interview guide. It should exclude `node_modules`, `.env`, build output, and generated local artifacts.
