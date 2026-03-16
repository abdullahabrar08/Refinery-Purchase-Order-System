-- Lookup tables (reference data)
CREATE TABLE IF NOT EXISTS order_statuses (
  order_status_id   SERIAL PRIMARY KEY,
  order_status_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id   SERIAL PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL UNIQUE
);

-- Purchase orders (status and supplier as FKs)
CREATE TABLE IF NOT EXISTS purchase_orders (
  purchase_order_id   SERIAL PRIMARY KEY,
  po_number           VARCHAR(50) UNIQUE,
  cost_center         VARCHAR(50),
  needed_by           DATE,
  payment_terms       VARCHAR(100),
  -- Supplier is chosen when the order is created and stays fixed afterward.
  supplier_id         INT NOT NULL REFERENCES suppliers(supplier_id),
  status_id           INT NOT NULL REFERENCES order_statuses(order_status_id) DEFAULT 1,
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ,
  created_by          INT
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  purchase_order_item_id SERIAL PRIMARY KEY,
  purchase_order_id      INT NOT NULL REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
  catalog_item_id        VARCHAR(50) NOT NULL,
  quantity               INT NOT NULL CHECK (quantity > 0),
  item_name              VARCHAR(500),
  item_price_usd         NUMERIC(12,2),
  item_lead_time_days    INT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(purchase_order_id, catalog_item_id)
);

CREATE TABLE IF NOT EXISTS purchase_order_status_timeline (
  purchase_order_status_timeline_id SERIAL PRIMARY KEY,
  purchase_order_id                 INT NOT NULL REFERENCES purchase_orders(purchase_order_id) ON DELETE CASCADE,
  status_id                         INT NOT NULL REFERENCES order_statuses(order_status_id),
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                        INT
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_id ON purchase_orders(status_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_status_timeline_order_id ON purchase_order_status_timeline(purchase_order_id);

CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
