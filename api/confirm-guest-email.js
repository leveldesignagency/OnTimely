const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { confirmation_token } = req.body || {};
    
    if (!confirmation_token) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing confirmation token' 
      });
    }

    // Call the confirm_guest_email function
    const { data, error } = await supabase.rpc('confirm_guest_email', {
      p_confirmation_token: confirmation_token
    });

    if (error) {
      console.error('Error confirming guest email:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Database error confirming email' 
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired confirmation token' 
      });
    }

    const result = data[0];
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        guest_email: result.guest_email
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error in confirm-guest-email:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};
