-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ESTIMATOR', 'TECH');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('DRAFT', 'QUOTED', 'ORDERED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'FULFILLED', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('QUOTE', 'PO');

-- CreateTable
CREATE TABLE "orgs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pricingtier" TEXT,
    "taxstatus" TEXT,
    "paymentterms" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordhash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ESTIMATOR',
    "orgid" INTEGER NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "family_id" INTEGER,
    "unit_cost" DECIMAL(65,30),
    "currency" TEXT,
    "msrp" DECIMAL(65,30),
    "margin" DECIMAL(65,30),
    "base_margin" DECIMAL(65,30),
    "tier_base_discount" DECIMAL(65,30),
    "tier_plus_discount" DECIMAL(65,30),
    "volume_breaks" JSONB,
    "lead_time_days" INTEGER,
    "stock_band" TEXT,
    "facets" JSONB,
    "variant_facets" JSONB,
    "compat_requires" JSONB,
    "compat_blocks" JSONB,
    "bundle_components" TEXT,
    "supplier" JSONB,
    "pricing" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_families" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "defaultImage" TEXT,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "client_meta" JSONB,
    "status" "project_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_items" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "room_id" INTEGER,
    "product_id" INTEGER,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30),
    "discounts" JSONB,
    "notes" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_versions" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "totals" JSONB,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bom_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "bom_version_id" INTEGER NOT NULL,
    "type" "order_type" NOT NULL DEFAULT 'QUOTE',
    "status" "order_status" NOT NULL DEFAULT 'DRAFT',
    "shipping" JSONB,
    "tax" JSONB,
    "total" DECIMAL(65,30),
    "tracking" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_family_id_idx" ON "products"("family_id");

-- CreateIndex
CREATE INDEX "product_families_name_brand_idx" ON "product_families"("name", "brand");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_orgid_fkey" FOREIGN KEY ("orgid") REFERENCES "orgs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_versions" ADD CONSTRAINT "bom_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bom_version_id_fkey" FOREIGN KEY ("bom_version_id") REFERENCES "bom_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
