-- Fix real-time subscription issues for guests table
-- Run this in your Supabase SQL Editor

-- 1. Check if guests table is in the real-time publication
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'guests'
    ) 
    THEN 'GUESTS TABLE IS IN REALTIME PUBLICATION' 
    ELSE 'GUESTS TABLE IS NOT IN REALTIME PUBLICATION' 
  END as realtime_status;

-- 2. Guests table is already in real-time publication (good!)
-- ALTER PUBLICATION supabase_realtime ADD TABLE guests; -- SKIP THIS - already exists

-- 3. Check current RLS policies on guests table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'guests';

-- 4. Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can view guests from their company" ON guests;

-- Create policy that allows real-time subscriptions
CREATE POLICY "Users can view guests from their company" ON guests
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. Test real-time subscription by inserting a test record
-- (This will help verify the subscription is working)
INSERT INTO guests (
  event_id,
  company_id,
  first_name,
  last_name,
  email,
  contact_number,
  country_code,
  id_type,
  id_number,
  status
) VALUES (
  (SELECT id FROM events LIMIT 1), -- Use an existing event ID
  (SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1), -- Use current user's company
  'Test',
  'Guest',
  'test@example.com',
  '123456789',
  '+44',
  'passport',
  'TEST123',
  'pending'
) ON CONFLICT DO NOTHING;

-- 6. Check if the test guest was created
SELECT * FROM guests WHERE email = 'test@example.com';

-- 7. Clean up test data
DELETE FROM guests WHERE email = 'test@example.com'; 