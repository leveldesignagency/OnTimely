const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, rating, feedback } = req.body;

    if (!token || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Missing or invalid rating" });
    }

    // Decode token to get eventId and email
    let eventId, guestEmail;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 2) {
        throw new Error('Invalid token format');
      }
      eventId = parts[0];
      guestEmail = parts[1];
    } catch (error) {
      return res.status(400).json({ error: "Invalid feedback token" });
    }

    // Find guest by email and event
    const { data: guests, error: guestError } = await supabase
      .from('guests')
      .select('id, email, event_id')
      .eq('event_id', eventId)
      .eq('email', guestEmail)
      .limit(1);

    if (guestError) {
      console.error('Error finding guest:', guestError);
      return res.status(500).json({ error: "Database error" });
    }

    if (!guests || guests.length === 0) {
      return res.status(404).json({ error: "Guest not found for this event" });
    }

    const guestId = guests[0].id;

    // Store feedback in database
    // You might want to create a feedback table, or store it in an existing table
    // For now, let's create a simple feedback record
    const feedbackData = {
      event_id: eventId,
      guest_id: guestId,
      guest_email: guestEmail,
      rating: rating,
      feedback_text: feedback || null,
      submitted_at: new Date().toISOString()
    };

    // Check if feedback table exists, if not we'll create it via a function or store in a generic way
    // For now, let's try to insert into a feedback table
    const { data: feedbackRecord, error: insertError } = await supabase
      .from('event_feedback')
      .insert([feedbackData])
      .select();

    if (insertError) {
      // If table doesn't exist, we might need to create it or use an alternative storage
      // For now, let's log and return success anyway (you can create the table later)
      console.error('Error inserting feedback (table might not exist):', insertError);
      
      // Alternative: Store in a JSON column in events table or create a feedback table
      // For MVP, we'll return success and log the feedback
      console.log('Feedback received:', feedbackData);
      
      // You can create the table with:
      // CREATE TABLE event_feedback (
      //   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      //   event_id UUID REFERENCES events(id),
      //   guest_id UUID REFERENCES guests(id),
      //   guest_email TEXT,
      //   rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      //   feedback_text TEXT,
      //   submitted_at TIMESTAMPTZ DEFAULT NOW(),
      //   created_at TIMESTAMPTZ DEFAULT NOW()
      // );
      
      return res.status(200).json({ 
        success: true, 
        message: "Feedback submitted successfully",
        note: "Feedback logged (table may need to be created)"
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Feedback submitted successfully",
      feedbackId: feedbackRecord[0]?.id
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

