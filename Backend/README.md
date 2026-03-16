# Backend (Microservices)

- **Auth Service**: Node + Express, PostgreSQL (plain queries). Roles: Admin, Buyer. Login returns JWT. DB: `users_dev`.
- **Catalog Service**: Node + Express, MongoDB + Mongoose. Search/filter/sort items. Auth: Bearer JWT (Admin/Buyer).
- **Procurement Service**: Node + Express, PostgreSQL (plain queries). Drafts, lines, submit PO, status timeline. Uses Catalog API via `network/catalog.client.js`. Auth: Bearer JWT (Admin/Buyer).

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

## Catalog Service – Quick start

1. **Start databases** (from repo root): `docker-compose up -d` (auth-db + catalog-db).
2. **Seed catalog** (once): From repo root, run seed so the Catalog DB has items:
   ```bash
   cd "Catalog Service"
   cp .env.example .env.development
   npm install
   npm run seed
   ```
3. **Run Catalog service**: `npm run dev` (default port 4002).
4. **Endpoints** (require `Authorization: Bearer <token>` from Auth service; roles Admin or Buyer):
   - `GET /catalog/healthz` – health (no auth).
   - `GET /catalog/items?search=&category=&inStock=&sort=&page=1&limit=20` – list items.
   - `GET /catalog/items/:id` – get one item.
   - API docs: `http://localhost:4002/catalog/api-docs`.

Use the same `JWT_SECRET` as Auth service in `.env.development` so tokens verify.

## Procurement Service – Quick start

1. **Start all DBs** (from repo root): `docker-compose up -d` (auth-db, catalog-db, procurement-db).
2. **Run Auth and Catalog** so you have a JWT and Catalog has items.
3. **Procurement**:
   ```bash
   cd "Procurement Service"
   cp .env.example .env.development   # set CATALOG_SERVICE_URL=http://localhost:4002/catalog
   npm install
   npm run dev
   ```
4. **Endpoints** (all require `Authorization: Bearer <token>`):
   - `GET /procurement/healthz` – health (no auth).
   - `POST /procurement/orders` – create draft.
   - `GET /procurement/orders?status=` – list orders.
   - `GET /procurement/orders/:id` – get order with lines and timeline.
   - `PATCH /procurement/orders/:id` – update draft header (requestor, cost_center, needed_by, payment_terms).
   - `DELETE /procurement/orders/:id` – delete draft.
   - `POST /procurement/orders/:id/lines` – add line (body: `catalogItemId`, `quantity`). Returns **409** if supplier mismatch.
   - `PATCH /procurement/orders/:id/lines/:lineId` – update line quantity.
   - `DELETE /procurement/orders/:id/lines/:lineId` – remove line.
   - `POST /procurement/orders/:id/submit` – submit draft (generates PO number, snapshots price/lead time).
   - `POST /procurement/orders/:id/status` – body: `{ "status": "Approved" | "Rejected" | "Fulfilled" }`.
   - API docs: `http://localhost:4003/procurement/api-docs`.

**Catalog client**: `network/catalog.client.js` calls `GET {CATALOG_SERVICE_URL}/items/:id` with the request Bearer token when adding lines and on submit.

## Docker Compose

- **auth-db**: PostgreSQL 16 (port 5432), DB: `users_dev`, user: `pos_dev`.
- **catalog-db**: MongoDB 7 (port 27017), DB: `catalog_dev`.
- **procurement-db**: PostgreSQL 16 (host port **5433**), DB: `procurement_dev`, user: `pos_dev`.

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
