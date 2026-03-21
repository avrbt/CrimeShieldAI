-- CrimeShield Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lfksrwqamtfqrexoxlnp/editor

-- Create KV Store table for storing application data
CREATE TABLE IF NOT EXISTS kv_store_cfc8313f (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for fast prefix searches (used for getting alerts, evidence, etc.)
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_cfc8313f USING btree (key text_pattern_ops);

-- Add index for faster updates
CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at 
ON kv_store_cfc8313f (updated_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS kv_store_updated_at_trigger ON kv_store_cfc8313f;
CREATE TRIGGER kv_store_updated_at_trigger
  BEFORE UPDATE ON kv_store_cfc8313f
  FOR EACH ROW
  EXECUTE FUNCTION update_kv_store_updated_at();

-- Grant necessary permissions (if needed)
-- Note: Edge Functions use service_role, so this should work automatically
-- But if you have RLS enabled, you might need:
-- ALTER TABLE kv_store_cfc8313f ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role can do anything" ON kv_store_cfc8313f 
--   FOR ALL USING (auth.role() = 'service_role');

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'kv_store_cfc8313f'
ORDER BY ordinal_position;

-- Show indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'kv_store_cfc8313f';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '   Table: kv_store_cfc8313f';
  RAISE NOTICE '   Indexes: Created';
  RAISE NOTICE '   Triggers: Created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Deploy Edge Function (see /DEPLOY-NOW.md)';
  RAISE NOTICE '   2. Set environment variables';
  RAISE NOTICE '   3. Test with /simple-test.html';
END $$;
