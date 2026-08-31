-- FASE 3D.3 — Orders and Order Items Migration
-- Created: 2026-08-28

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,

  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,

  ghl_contact_id VARCHAR(255) NULL,

  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'ES',

  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  delivery_date DATE NULL,

  dedicatory TEXT NULL,
  notes TEXT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL,

  CONSTRAINT valid_status CHECK (
    status IN (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'cancelled'
    )
  ),

  CONSTRAINT valid_total CHECK (total >= 0),
  CONSTRAINT valid_subtotal CHECK (subtotal >= 0),

  CONSTRAINT valid_email CHECK (
    customer_email ~* '^[^@]+@[^@]+$'
  )
);

-- Índices para orders
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_ghl_contact ON orders(ghl_contact_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id UUID NOT NULL,

  ghl_product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,

  size VARCHAR(100) NOT NULL,

  quantity INT NOT NULL,

  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  color VARCHAR(100) NULL,
  special_instructions TEXT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT positive_quantity
    CHECK (quantity > 0),

  CONSTRAINT valid_price
    CHECK (unit_price > 0),

  CONSTRAINT valid_subtotal
    CHECK (subtotal > 0)
);

-- Índices para order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_ghl_product ON order_items(ghl_product_id);

-- ============================================
-- TRIGGER: Update updated_at for orders
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_orders()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_orders();

-- ============================================
-- TRIGGER: Update updated_at for order_items
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_order_items()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at_order_items
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_order_items();

-- ============================================
-- Comment: Tables created for FASE 3D.3
-- ============================================
COMMENT ON TABLE orders IS 'Ecommerce orders from floristeria-lucia';
COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON COLUMN orders.ghl_contact_id IS 'Reference to GoHighLevel contact (external)';
COMMENT ON COLUMN order_items.ghl_product_id IS 'Reference to GoHighLevel product (external)';
