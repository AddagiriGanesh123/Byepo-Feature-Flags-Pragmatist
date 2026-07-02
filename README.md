# Multi-Tenant Feature Flag Management System

Built for the Byepo Technologies "Pragmatist" technical assessment.

## Tech Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** Custom implementation — `bcryptjs` for password hashing, `jsonwebtoken` for session tokens (no third-party auth providers)
- **Frontend:** Three separate plain HTML/CSS/JS apps (no framework), one per role

## Roles
| Role | How they authenticate | Capabilities |
|---|---|---|
| **Super Admin** | Static credentials from `.env` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`) | Log in, create organizations, view organizations |
| **Org Admin** | Signs up / logs in against the `users` table (bcrypt-hashed password) | Create, enable/disable, and delete feature flags — scoped to their own organization |
| **End User** | No login required (per assignment spec) | Selects an organization and a feature key, checks whether it's enabled |

## Project Structure
```
byepo-feature-flags/
├── backend/
│   ├── config/db.js           # PostgreSQL connection pool
│   ├── middleware/auth.js     # JWT verification + role-guard middleware
│   ├── controllers/           # Business logic per role
│   ├── routes/                # Express route definitions
│   └── server.js              # App entrypoint
├── database/schema.sql        # Tables: organizations, roles, users, feature_flags
├── frontend/
│   ├── super-admin/           # Super Admin app
│   ├── admin/                 # Org Admin app
│   └── user/                  # End User app
├── .env.example
└── package.json
```

## Design Decisions
- **Multi-tenancy** is enforced at the query level: every feature-flag and user row is scoped by `org_id`, and the Org Admin's JWT carries their `org_id` so all flag routes filter by it server-side (never trusting a client-supplied org id for writes).
- **Super Admin has no DB row** — static/config credentials are explicitly allowed by the spec, so it's checked directly against environment variables rather than over-engineering a table for a single account.
- **`(org_id, feature_key)` is a unique constraint** in the DB, so duplicate flags per organization are impossible even under race conditions, not just blocked in application code.
- **End User flow requires no login** — the assignment describes it as a simple check form, so it's kept frictionless; the org is selected explicitly rather than inferred, since there's no session to infer it from.
- **Three frontends are fully separate static apps** (own HTML/CSS/JS, no shared build step) so each can be reviewed and run independently, while sharing one backend and one JWT/role contract.

## Local Setup & Testing

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL installed and running locally

### 2. Install dependencies
```bash
cd byepo-feature-flags
npm install
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE feature_flags_db;"
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` and set your actual `DATABASE_URL`, e.g.:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/feature_flags_db
```

### 5. Load the schema
```bash
psql -U postgres -d feature_flags_db -f database/schema.sql
```

### 6. Start the server
```bash
npm run dev
```
You should see:
```
🚩 Feature Flag System running on port 5000
   Home:        http://localhost:5000
   Super Admin: http://localhost:5000/super-admin
   Org Admin:   http://localhost:5000/admin
   End User:    http://localhost:5000/user
```

### 7. Test the full flow
1. Open **http://localhost:5000/super-admin** — log in with the credentials from your `.env` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`), create an organization (e.g. "Acme Corp").
2. Open **http://localhost:5000/admin** — click "Sign Up", pick "Acme Corp" from the dropdown, create an admin account, then log in. Add a feature flag (e.g. `dark_mode`) and toggle it enabled.
3. Open **http://localhost:5000/user** — select "Acme Corp", type `dark_mode`, click Check — it should show **ENABLED**. Try a key that doesn't exist to see the "not configured" state.

### API quick reference
```
POST   /api/superadmin/login
POST   /api/superadmin/organizations      (auth: super_admin)
GET    /api/superadmin/organizations      (auth: super_admin)

POST   /api/admin/signup
POST   /api/admin/login
GET    /api/admin/flags                   (auth: org_admin)
POST   /api/admin/flags                   (auth: org_admin)
PUT    /api/admin/flags/:id               (auth: org_admin)
DELETE /api/admin/flags/:id               (auth: org_admin)

GET    /api/public/organizations
POST   /api/public/check-flag
```

## Time Spent
~7 hours — data modeling, backend + auth, three frontends, and testing.
