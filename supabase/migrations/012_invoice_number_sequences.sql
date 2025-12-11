-- ============================================
-- MIGRATION 012: Invoice Number Sequences
-- Date: 2024-12-11
-- Description: Système de génération automatique des numéros de facture
-- ============================================

-- Create invoice_number_sequences table in inter_app schema
CREATE TABLE IF NOT EXISTS inter_app.invoice_number_sequences (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (tenant_id, year)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_number_sequences_tenant_year
  ON inter_app.invoice_number_sequences(tenant_id, year);

-- ============================================
-- FUNCTION: Generate next invoice number
-- Format: INV-YYYY-NNNN (ex: INV-2024-0001)
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Lock the row to prevent race conditions
  -- Use INSERT ... ON CONFLICT to handle first invoice of the year
  INSERT INTO inter_app.invoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, v_year, 1)
  ON CONFLICT (tenant_id, year)
  DO UPDATE SET
    last_number = inter_app.invoice_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  -- Format: INV-2024-0001
  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_invoice_number;
END;
$$;

-- ============================================
-- FUNCTION: Set invoice number on insert (if not provided)
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only generate if invoice_number is not provided
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := inter_app.generate_invoice_number(NEW.tenant_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Auto-generate invoice number on insert
-- ============================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_invoice_number_on_insert ON inter_app.invoices;

-- Create new trigger
CREATE TRIGGER set_invoice_number_on_insert
  BEFORE INSERT ON inter_app.invoices
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.set_invoice_number();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_invoice_number_sequences_updated_at ON inter_app.invoice_number_sequences;
CREATE TRIGGER update_invoice_number_sequences_updated_at
  BEFORE UPDATE ON inter_app.invoice_number_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE inter_app.invoice_number_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sequences for their tenant
CREATE POLICY "Users can view sequences for their tenant"
  ON inter_app.invoice_number_sequences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = invoice_number_sequences.tenant_id
        AND utr.user_id = auth.uid()
    )
  );

-- Policy: System can manage sequences (for trigger)
CREATE POLICY "System can manage sequences"
  ON inter_app.invoice_number_sequences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON inter_app.invoice_number_sequences TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA inter_app TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE inter_app.invoice_number_sequences IS 'Séquences de numérotation automatique des factures par tenant et par année';
COMMENT ON FUNCTION inter_app.generate_invoice_number(UUID) IS 'Génère le prochain numéro de facture au format INV-YYYY-NNNN';
COMMENT ON COLUMN inter_app.invoice_number_sequences.last_number IS 'Dernier numéro utilisé pour cette année';
