-- Add gemrate_series_name to products for manual pack (series) selection.
-- Format: "パック名|発売年" (same as gemrate_stats.series_name).
-- When NULL, series_name is derived from name_jp + release_date as before.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS gemrate_series_name VARCHAR(255) NULL;

COMMENT ON COLUMN products.gemrate_series_name IS 'Hand-picked pack for Gemrate: series_name format "pack|year". NULL = use name_jp + release_date.';
