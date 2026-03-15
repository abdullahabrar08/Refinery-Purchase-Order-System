# Backend (Microservices)

- **Auth Service**: Node + Express, PostgreSQL (plain queries). Roles: Admin, Buyer. Login returns JWT. DB: `users_dev`.
- **Catalog Service**: Node + Express, MongoDB + Mongoose (to be added).
- **Procurement Service**: Node + Express, PostgreSQL (plain queries) (to be added).

## Auth Service – Quick start

1. **Start the Auth database** (from repo root):

   ```bash
   docker-compose up -d
   ```

   This starts PostgreSQL (`users_dev` DB) on port `5432`.

2. **Configure and run Auth service**:

   ```bash
   cd "Auth Service"
   cp .env.example .env.development   # or edit .env.development with your values
   npm install
   npm run dev
   ```

   On first run, the service applies the users schema and seeds **roles** (Admin, Buyer) and **default users**.

3. **Login** (only route for now):

   ```http
   POST /users/login
   Content-Type: application/json

   { "email": "buyer@users.local", "password": "Password123!" }
   ```

   Or use the admin user: `admin@users.local` / `Password123!`.

   Response includes `token` (JWT) and `user` (id, username, email, role).

## Default seed users

| Role  | Email               | Password     |
|-------|---------------------|--------------|
| Admin | admin@users.local   | Password123! |
| Buyer | buyer@users.local   | Password123! |

## Docker Compose

- **Current**: `auth-db` (PostgreSQL 16) for Auth service (DB: `users_dev`, user: `pos_dev`).
- **Later**: Add services for Catalog (MongoDB) and Procurement (PostgreSQL) as needed.

### If you see "role pos_dev does not exist"

The DB volume was created with different credentials. Reset it so Postgres re-initializes:

**PowerShell (from repo root):**
```powershell
docker-compose down -v
docker volume ls   # note any volume named *auth-db-data*
docker volume rm <project>_auth-db-data   # use the name from ls if down -v didn't remove it
docker-compose up -d
```

Or run: `.\scripts\reset-auth-db.ps1`

Then wait ~5 seconds and start the Auth service again.
