// Client-side function to submit form responses
async function submitFormResponse(token, email, responses) {
  try {
    // Real Supabase credentials
    const supabaseUrl = 'https://ijsktwmevnqgzwwuggkf.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc2t0d21ldm5xZ3p3d3VnZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU4MTYsImV4cCI6MjA2NjI4MTgxNn0.w4eBL4hOZoAOo33ZXX-lSqQmIuSoP3fBEO1lBlpIRNw';
    
    // Call Supabase RPC function to submit form and create guest
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_form_and_create_guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        p_token: token,
        p_email: email,
        p_responses: responses
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Form submitted successfully:', result);
    return result;

  } catch (error) {
    console.error('Submit form error:', error);
    throw new Error('Failed to submit form: ' + error.message);
  }
} 