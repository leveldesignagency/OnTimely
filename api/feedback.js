const { Resend } = require("resend");
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOGO_URL = "https://ontimely.co.uk/on-timely-official-logo-email.png";
const FAVICON_URL = "https://ontimely.co.uk/ontimely-favicon-email.png";

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
    const body = req.body;
    
    // Determine operation type based on request body
    // If it has eventId and guestEmails, it's a feedback request
    // If it has token and rating, it's a feedback submission
    if (body.eventId && body.guestEmails && Array.isArray(body.guestEmails)) {
      // OPERATION 1: Send Feedback Request
      return await handleSendFeedbackRequest(req, res, body);
    } else if (body.token && body.rating) {
      // OPERATION 2: Submit Feedback
      return await handleSubmitFeedback(req, res, body);
    } else {
      return res.status(400).json({ error: "Invalid request. Must include either (eventId, guestEmails) or (token, rating)" });
    }
  } catch (error) {
    console.error("Feedback API error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

// Handle sending feedback request emails
async function handleSendFeedbackRequest(req, res, body) {
  const { eventId, eventName, guestEmails, customMessage } = body;

  if (!eventId || !eventName || !guestEmails || !Array.isArray(guestEmails) || guestEmails.length === 0) {
    return res.status(400).json({ error: "Missing required fields: eventId, eventName, guestEmails" });
  }

  // Generate unique feedback token for each guest
  const feedbackLinks = guestEmails.map(email => {
    const token = Buffer.from(`${eventId}:${email}:${Date.now()}`).toString('base64');
    const feedbackUrl = `https://guest.ontimely.co.uk/feedback/${token}`;
    return { email, feedbackUrl };
  });

  // Create feedback request email template
  const createFeedbackEmailHtml = (feedbackUrl, guestEmail) => {
    const personalMessage = customMessage ? `
      <tr>
        <td style="padding: 0 0 30px 0;">
          <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 400; color: #ffffff; line-height: 1.6;">${customMessage}</p>
        </td>
      </tr>
    ` : '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <link rel="icon" type="image/x-icon" href="${FAVICON_URL}">
      <title>Event Feedback Request - ${eventName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #000000;">
              <!-- Header with Logo -->
              <tr>
                <td style="padding: 0 0 40px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="left" width="80">
                        <img src="${LOGO_URL}" alt="OnTimely Logo" width="80" height="80" style="display: block; border: 0;" />
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <img src="${FAVICON_URL}" alt="OnTimely" width="40" height="40" style="display: block; border: 0;" />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 0;">
                  <h1 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px;">${eventName}</h1>
                  <h2 style="margin: 0 0 30px 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px;">We'd Love Your Feedback</h2>
                  <p style="margin: 0 0 30px 0; font-size: 18px; font-weight: 400; color: #ffffff; line-height: 1.6;">Thank you for being part of ${eventName}! We hope you had a wonderful experience. Your feedback helps us improve and create even better events in the future.</p>
                  ${personalMessage}
                  <p style="margin: 0 0 40px 0; font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.6;">Please take a moment to share your thoughts about the event:</p>
                  
                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 40px 0;">
                    <tr>
                      <td align="left">
                        <a href="${feedbackUrl}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #000000; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Share Your Feedback</a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Link Fallback -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0; border: 2px solid #22c55e; border-radius: 8px;">
                    <tr>
                      <td style="padding: 30px;">
                        <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: #ffffff; text-transform: uppercase; line-height: 1.5;">If you cannot click the button, copy and paste this link into your browser:</p>
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #ffffff; word-break: break-all; line-height: 1.6; font-family: monospace;">${feedbackUrl}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  };

  // Send emails to all guests
  const emailPromises = feedbackLinks.map(({ email, feedbackUrl }) => {
    return resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@ontimely.co.uk",
      to: email,
      subject: `${eventName} • We'd Love Your Feedback`,
      html: createFeedbackEmailHtml(feedbackUrl, email)
    });
  });

  const results = await Promise.all(emailPromises);
  
  // Check for any errors
  const errors = results.filter(result => result.error);
  if (errors.length > 0) {
    console.error("Some emails failed to send:", errors);
    return res.status(500).json({ 
      error: "Some emails failed to send", 
      details: errors,
      successCount: results.length - errors.length
    });
  }

  return res.status(200).json({ 
    success: true, 
    message: `Feedback requests sent to ${guestEmails.length} guest(s)`,
    sentCount: results.length
  });
}

// Handle submitting feedback
async function handleSubmitFeedback(req, res, body) {
  const { token, rating, feedback } = body;

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
  const feedbackData = {
    event_id: eventId,
    guest_id: guestId,
    guest_email: guestEmail,
    rating: rating,
    feedback_text: feedback || null,
    submitted_at: new Date().toISOString()
  };

  // Insert into feedback table
  const { data: feedbackRecord, error: insertError } = await supabase
    .from('event_feedback')
    .insert([feedbackData])
    .select();

  if (insertError) {
    console.error('Error inserting feedback (table might not exist):', insertError);
    console.log('Feedback received:', feedbackData);
    
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
}

