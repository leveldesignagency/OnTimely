// Client-side function to get form data
async function getFormByToken(token) {
  try {
    // You'll need to replace these with your actual Supabase URL and anon key
    const supabaseUrl = 'https://ijsktwmevnqgzwwuggkf.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqc2t0d21ldm5xZ3p3d3VnZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU4MTYsImV4cCI6MjA2NjI4MTgxNn0.w4eBL4hOZoAOo33ZXX-lSqQmIuSoP3fBEO1lBlpIRNw ';

    
    // Call your Supabase RPC function directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_form_by_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        p_token: token
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Form not found');
    }

    const form = data[0];
    
    return {
      title: form.title,
      description: form.description,
      fields: form.fields || []
    };

  } catch (error) {
    console.error('Get form error:', error);
    throw new Error('Failed to load form');
  }
} 