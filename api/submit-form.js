const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, responses } = req.body;

    if (!token || !responses) {
      return res.status(400).json({ error: "Token and responses are required" });
    }

    // Get email directly from form responses - it should be a field in the form
    const email = responses.email || responses.Email || responses.emailAddress || null;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required in form responses" });
    }

    // Use submit_form_and_create_guest to create guest record when form is submitted
    const { data, error } = await supabase.rpc("submit_form_and_create_guest", {
      p_token: token,
      p_email: email,
      p_responses: responses
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to submit form: " + error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Submit form error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
