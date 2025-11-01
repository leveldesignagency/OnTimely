// Client-side function to get form data via Vercel API
async function getFormByToken(token) {
  try {
    // Use Vercel API endpoint instead of direct Supabase call
    const apiUrl = `/api/get-form?token=${encodeURIComponent(token)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const formData = await response.json();
    
    if (!formData || !formData.title) {
      throw new Error('Form not found');
    }
    
    return {
      title: formData.title,
      description: formData.description,
      fields: formData.fields || []
    };

  } catch (error) {
    console.error('Get form error:', error);
    throw new Error('Failed to load form: ' + (error.message || 'Unknown error'));
  }
}
