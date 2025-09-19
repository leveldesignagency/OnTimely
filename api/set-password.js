const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async function handler(req, res) {
  console.log('Set password API called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, token } = req.body;
    console.log('Received request body:', { email, password: password ? '[REDACTED]' : 'missing', token });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      });
    }

    // Get user by email
    console.log('Looking up user with email:', email);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !users) {
      console.error('User lookup error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user with ID:', users.id);

    // Update password using Supabase Auth Admin API
    console.log('Updating password for user:', users.id);
    const { data, error } = await supabase.auth.admin.updateUserById(users.id, {
      password: password
    });

    if (error) {
      console.error('Password update error:', error);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}