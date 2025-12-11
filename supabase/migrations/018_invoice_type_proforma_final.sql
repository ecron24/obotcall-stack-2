-- ============================================
-- MIGRATION 013: Invoice Type (Proforma / Final)
-- Date: 2024-12-11
-- Description: Ajout du type de facture et workflow proforma → définitive
-- ============================================

-- Add invoice_type column to invoices
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'proforma'
  CHECK (invoice_type IN ('proforma', 'final'));

-- Add columns for proforma validation workflow
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS proforma_validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proforma_validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_to_final_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS converted_to_final_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add columns for invoice sending
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sent_to_emails TEXT[];

-- Add column for document storage (Google Drive, S3, etc.)
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_uploaded_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_type ON inter_app.invoices(invoice_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_proforma_validated ON inter_app.invoices(proforma_validated_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_sent_at ON inter_app.invoices(sent_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_converted_to_final ON inter_app.invoices(converted_to_final_at) WHERE deleted_at IS NULL;

-- ============================================
-- FUNCTION: Convert proforma to final invoice
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.convert_proforma_to_final(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
  v_new_invoice_number TEXT;
BEGIN
  -- Get the proforma invoice
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND deleted_at IS NULL;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture proforma non trouvée ou déjà convertie';
  END IF;

  -- Generate new invoice number for final invoice
  v_new_invoice_number := inter_app.generate_invoice_number(v_invoice.tenant_id);

  -- Update invoice to final
  UPDATE inter_app.invoices
  SET
    invoice_type = 'final',
    invoice_number = v_new_invoice_number,
    converted_to_final_at = NOW(),
    converted_to_final_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- FUNCTION: Validate proforma invoice
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.validate_proforma_invoice(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  -- Get the proforma invoice
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND deleted_at IS NULL;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture proforma non trouvée';
  END IF;

  IF v_invoice.proforma_validated_at IS NOT NULL THEN
    RAISE EXCEPTION 'Facture proforma déjà validée';
  END IF;

  -- Validate proforma
  UPDATE inter_app.invoices
  SET
    proforma_validated_at = NOW(),
    proforma_validated_by = p_user_id,
    status = 'sent',
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- FUNCTION: Mark invoice as sent
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.mark_invoice_sent(
  p_invoice_id UUID,
  p_user_id UUID,
  p_sent_to_emails TEXT[]
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  -- Update invoice
  UPDATE inter_app.invoices
  SET
    sent_at = NOW(),
    sent_by = p_user_id,
    sent_to_emails = p_sent_to_emails,
    status = CASE
      WHEN status = 'draft' THEN 'sent'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id
    AND deleted_at IS NULL
  RETURNING * INTO v_invoice;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture non trouvée';
  END IF;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN inter_app.invoices.invoice_type IS 'Type de facture: proforma (devis) ou final (définitive)';
COMMENT ON COLUMN inter_app.invoices.proforma_validated_at IS 'Date de validation de la facture proforma';
COMMENT ON COLUMN inter_app.invoices.converted_to_final_at IS 'Date de conversion proforma → finale';
COMMENT ON COLUMN inter_app.invoices.sent_at IS 'Date d''envoi de la facture au client';
COMMENT ON COLUMN inter_app.invoices.document_url IS 'URL du document PDF (Google Drive, S3, etc.)';

COMMENT ON FUNCTION inter_app.convert_proforma_to_final(UUID, UUID) IS 'Convertit une facture proforma en facture définitive';
COMMENT ON FUNCTION inter_app.validate_proforma_invoice(UUID, UUID) IS 'Valide une facture proforma';
COMMENT ON FUNCTION inter_app.mark_invoice_sent(UUID, UUID, TEXT[]) IS 'Marque une facture comme envoyée';
