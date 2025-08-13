// Client-side function to submit form responses
async function submitFormResponse(token, email, responses) {
  try {
    // You'll need to replace these with your actual Supabase URL and anon key
    const supabaseUrl = 'https://your-project.supabase.co';
    const supabaseKey = 'your-anon-key';
    
    // Call your Supabase RPC function to submit the form
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_form_response`, {
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Submit form error:', error);
    throw new Error('Failed to submit form');
  }
} 