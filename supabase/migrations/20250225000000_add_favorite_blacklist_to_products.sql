-- Add user preference columns for list filtering (favorite) and hiding (blacklist).
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.is_favorite IS 'User favorite; when true, shown when filtering by "お気に入りのみ".';
COMMENT ON COLUMN products.is_blacklisted IS 'When true, product is hidden from the main list.';
