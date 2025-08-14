-- Function to submit form response AND create guest record
-- This extends the existing submit_form_response functionality
CREATE OR REPLACE FUNCTION submit_form_and_create_guest(
  p_token TEXT,
  p_email TEXT,
  p_responses JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_form_id UUID;
  v_recipient_id UUID;
  v_response_id UUID;
  v_event_id UUID;
  v_company_id UUID;
  v_guest_id UUID;
  v_form_fields JSONB;
BEGIN
  -- Get form ID, recipient ID, and form details from token
  SELECT 
    fr.form_id, 
    fr.id,
    f.event_id,
    f.company_id,  -- This gets the company_id from the FORM, not the guest
    f.fields
  INTO v_form_id, v_recipient_id, v_event_id, v_company_id, v_form_fields
  FROM form_recipients fr
  JOIN forms f ON f.id = fr.form_id
  WHERE fr.token = p_token;
  
  IF v_form_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;
  
  -- Check if already submitted
  IF EXISTS (
    SELECT 1 FROM form_submissions 
    WHERE recipient_id = v_recipient_id
  ) THEN
    RAISE EXCEPTION 'Form already submitted';
  END IF;
  
  -- Insert the submission
  INSERT INTO form_submissions (
    form_id,
    recipient_id,
    email,
    responses,
    submitted_at
  ) VALUES (
    v_form_id,
    v_recipient_id,
    p_email,
    p_responses,
    NOW()
  )
  RETURNING id INTO v_response_id;
  
  -- Mark recipient as responded
  UPDATE form_recipients 
  SET responded_at = NOW()
  WHERE id = v_recipient_id;
  
  -- Create guest record from form responses
  -- company_id comes from the FORM, not the guest responses
  INSERT INTO guests (
    event_id,
    company_id,  -- This is the company that SENT the form
    first_name,
    middle_name,
    last_name,
    email,
    contact_number,
    country_code,
    id_type,
    id_number,
    id_country,
    dob,
    gender,
    dietary,
    medical,
    modules,
    module_values,
    prefix,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_event_id,
    v_company_id,  -- From the form, not guest responses
    COALESCE(p_responses->>'firstName', p_responses->>'first_name', ''),
    COALESCE(p_responses->>'middleName', p_responses->>'middle_name', ''),
    COALESCE(p_responses->>'lastName', p_responses->>'last_name', ''),
    p_email,
    COALESCE(p_responses->>'contactNumber', p_responses->>'contact_number', ''),
    COALESCE(p_responses->>'countryCode', p_responses->>'country_code', '+44'),
    COALESCE(p_responses->>'idType', p_responses->>'id_type', ''),
    COALESCE(p_responses->>'idNumber', p_responses->>'id_number', ''),
    COALESCE(p_responses->>'idCountry', p_responses->>'id_country', ''),
    CASE 
      WHEN p_responses->>'dob' IS NOT NULL THEN (p_responses->>'dob')::DATE
      ELSE NULL
    END,
    COALESCE(p_responses->>'gender', ''),
    CASE 
      WHEN p_responses->>'dietary' IS NOT NULL THEN p_responses->'dietary'
      ELSE '[]'::JSONB
    END,
    CASE 
      WHEN p_responses->>'medical' IS NOT NULL THEN p_responses->'medical'
      ELSE '[]'::JSONB
    END,
    v_form_fields,
    p_responses,
    COALESCE(p_responses->>'prefix', ''),
    'pending',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_guest_id;
  
  -- Return success with both IDs
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_response_id,
    'guest_id', v_guest_id,
    'message', 'Form submitted and guest created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback any changes if there's an error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to submit form and create guest'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_form_and_create_guest(TEXT, TEXT, JSONB) TO anon; 