DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('DRAFT', 'QUOTED', 'ORDERED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'FULFILLED', 'SHIPPED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
    CREATE TYPE order_type AS ENUM ('QUOTE', 'PO');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_meta JSONB,
  status project_status DEFAULT 'DRAFT',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS line_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL,
  unit_price NUMERIC,
  discounts JSONB,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_versions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  totals JSONB,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  bom_version_id INTEGER REFERENCES bom_versions(id) ON DELETE SET NULL,
  type order_type DEFAULT 'QUOTE',
  status order_status DEFAULT 'DRAFT',
  shipping JSONB,
  tax JSONB,
  total NUMERIC,
  tracking JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
