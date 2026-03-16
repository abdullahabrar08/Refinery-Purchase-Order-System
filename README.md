# Refinery Purchase Order (PO) System

A comprehensive, microservices-based Purchase Order management system designed for refinery operations. It provides a robust backend architecture with distinct services and a modern, responsive React frontend portal for both Buyers and Administrators.

## 🏗️ System Architecture

The project is built using a microservices architecture, separating concerns into distinct, independently scalable services.

### 1. Auth Service (Node.js/Express + PostgreSQL)
Handles user authentication and authorization using JWT and Casbin (RBAC).
- **Database**: PostgreSQL (`users_dev`)
- **Port**: 4001
- **Key Features**: Login, User retrieval, Role-based access control.

### 2. Catalog Service (Node.js/Express + MongoDB)
Manages the product catalog, allowing buyers to search, filter, and sort available items.
- **Database**: MongoDB (`catalog_dev`)
- **Port**: 4002
- **Key Features**: Paginated item listing, search by name/ID/supplier, filtering by category/stock, auto-seeding from JSON data.

### 3. Procurement Service (Node.js/Express + PostgreSQL)
The core engine for managing the Purchase Order lifecycle.
- **Database**: PostgreSQL (`procurement_dev`)
- **Port**: 4003
- **Key Features**: Draft creation, item management, PO submission, status transitions (Submitted -> Approved/Rejected -> Fulfilled), server-side pagination, strict supplier locking per PO.

### 4. Frontend Portal (React 19 + TypeScript + Vite)
A modern, responsive UI built with Tailwind CSS, providing distinct views for Buyers and Admins.
- **Port**: 5173 (Development) / Static Build
- **Key Features**: 
  - **Buyer Portal**: Browse catalog, manage single active draft, submit POs, view order history.
  - **Admin Portal**: Overview dashboard, review all submitted orders, approve/reject/fulfill orders.
  - **Shared**: Detailed order views with chronological status history.

---

## 🗄️ Database Details & Indexing

The system utilizes two PostgreSQL databases and one MongoDB database, orchestrated via Docker Compose.

### Users Database (`users_dev` - PostgreSQL)
Stores user credentials and roles.
- **Tables**: `users`, `roles`
- **Indexing**: 
  - `idx_users_email` on `users(email)` for fast login lookups.
  - `idx_users_role_id` on `users(role_id)` for RBAC queries.

### Procurement Database (`procurement_dev` - PostgreSQL)
Stores purchase orders, line items, and the status timeline.
- **Tables**: `purchase_orders`, `purchase_order_items`, `purchase_order_status_timeline`, `order_statuses` (lookup), `suppliers` (lookup).
- **Indexing**:
  - `idx_purchase_orders_status_id` on `purchase_orders(status_id)` for filtering orders by status.
  - `idx_purchase_orders_supplier_id` on `purchase_orders(supplier_id)`.
  - `idx_purchase_orders_created_by` on `purchase_orders(created_by)` for fetching a buyer's specific orders.
  - `idx_purchase_order_items_order_id` on `purchase_order_items(purchase_order_id)` for fast retrieval of line items.
  - `idx_purchase_order_status_timeline_order_id` on `purchase_order_status_timeline(purchase_order_id)` for timeline rendering.

### Catalog Database (`catalog_dev` - MongoDB)
Stores the product catalog.
- **Collections**: `items`
- **Indexing**:
  - Unique index on `id` (string identifier).
  - Text index on `name`, `supplier`, `manufacturer`, `model`, `description` for robust text search capabilities.

---

## 🚀 How to Run the Project

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v20+ recommended)
- npm

### 1. Start the Backend Services (Docker)
The entire backend infrastructure (databases and Node.js microservices) is containerized.

From the root directory of the project, run:
```bash
docker compose up -d --build
```

This command will:
1. Spin up PostgreSQL and MongoDB containers.
2. Build and start the Auth, Catalog, and Procurement Node.js services.
3. Automatically run bootstrap scripts to seed the databases with initial users, roles, lookup data, and the product catalog.

**Verify Services are Running:**
```bash
docker compose ps
```
You should see 6 containers running healthily (`auth-db`, `catalog-db`, `procurement-db`, `auth-service`, `catalog-service`, `procurement-service`).

### 2. Run the Frontend Portal

Open a new terminal, navigate to the `Frontend` directory, install dependencies, and start the development server:

```bash
cd Frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Demo Credentials
The login page includes auto-embed buttons for quick access, but you can also use:

**Admin User:**
- Email: `admin@gmail.com`
- Password: `Password123!`

**Buyer User:**
- Email: `buyer@gmail.com`
- Password: `Password123!`

---

## 🛠️ Development & Scripts

### Rebuilding the Frontend
If you make changes to the frontend and need to create a production build:
```bash
cd Frontend
npm run build
```

### Resetting Databases
If you need to wipe the databases and start fresh, you can bring down the docker containers with volumes, and bring them back up:
```bash
docker compose down -v
docker compose up -d --build
```
*(Note: The databases will automatically re-seed on startup).*