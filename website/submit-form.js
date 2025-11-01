// Client-side function to submit form responses via Vercel API
async function submitFormResponse(token, email, responses) {
  try {
    // Use Vercel API endpoint instead of direct Supabase call
    const apiUrl = '/api/submit-form';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        responses: responses
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('API response error:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Form submitted successfully:', result);
    return result;

  } catch (error) {
    console.error('Submit form error:', error);
    throw new Error('Failed to submit form: ' + (error.message || 'Unknown error'));
  }
}
