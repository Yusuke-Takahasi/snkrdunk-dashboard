-- Ensure app_settings table exists (new installs) and has fee_settings column.
CREATE TABLE IF NOT EXISTS app_settings (
  id bigint PRIMARY KEY,
  ui_preferences jsonb,
  gemrate_urls jsonb,
  fee_settings jsonb
);

-- For existing app_settings created without fee_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS fee_settings jsonb;

-- Ensure row id=1 exists so updateFeeSettings can update it
INSERT INTO app_settings (id, fee_settings)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN app_settings.fee_settings IS '販売手数料・PSA鑑定料金など。mercariFeePercent, snkrdunkFeePercent, psaValueBulk, psaValue, psaValuePlus, psaValueMax, psaRegular, psaExpress.';
