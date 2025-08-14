-- Create the missing create_form_recipients function
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_form_recipients';

-- 2. Drop the existing function first
DROP FUNCTION IF EXISTS create_form_recipients(uuid,text[]);

-- 3. Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION create_form_recipients(
  p_form_id UUID,
  p_emails TEXT[]
)
RETURNS TABLE(emails TEXT[], links TEXT[]) AS $$
DECLARE
  v_recipient_id UUID;
  v_token TEXT;
  v_email TEXT;
  v_emails_array TEXT[] := '{}';
  v_links_array TEXT[] := '{}';
BEGIN
  -- Loop through each email
  FOREACH v_email IN ARRAY p_emails
  LOOP
    BEGIN
      -- Generate a unique token
      v_token := encode(gen_random_bytes(32), 'hex');
      
      -- Insert the recipient
      INSERT INTO form_recipients (
        form_id,
        email,
        token,
        created_at
      ) VALUES (
        p_form_id,
        v_email,
        v_token,
        NOW()
      )
      RETURNING id INTO v_recipient_id;
      
      -- Add to arrays
      v_emails_array := array_append(v_emails_array, v_email);
      v_links_array := array_append(v_links_array, v_token);
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue
        RAISE NOTICE 'Error creating recipient for %: %', v_email, SQLERRM;
    END;
  END LOOP;
  
  -- Return the arrays
  RETURN QUERY SELECT v_emails_array, v_links_array;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty arrays on error
    RETURN QUERY SELECT ARRAY[]::TEXT[], ARRAY[]::TEXT[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION create_form_recipients(UUID, TEXT[]) TO anon;

-- 5. Check if the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_form_recipients'; 