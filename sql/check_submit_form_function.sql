-- Get the complete function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'submit_form_and_create_guest'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check function parameters
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'submit_form_and_create_guest'
  AND n.nspname = 'public';

-- Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'submit_form_and_create_guest'
  AND routine_schema = 'public';

