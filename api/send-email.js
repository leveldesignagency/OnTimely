const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { to, subject, html, emailType, email, password, eventName, guestName, confirmationToken, emails, link } = req.body;
    
    // Handle login credential emails
    if (emailType === 'login') {
      if (!email || !password || !eventName || !guestName) {
        return res.status(400).json({ error: 'Missing required fields for login email: email, password, eventName, guestName' });
      }
      
      // Use email as confirmation token if not provided (temporary fallback)
      const token = confirmationToken || encodeURIComponent(email);
      const confirmationUrl = `https://guest.ontimely.co.uk/guest-success-email-confirmed?token=${token}`;
      
      const loginEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #2563eb; margin: 0 0 8px; font-size: 28px;">Welcome to Timely</h1>
              <h2 style="color: #374151; margin: 0; font-size: 20px; font-weight: normal;">${eventName}</h2>
            </div>
            
            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${guestName},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              You've been invited to join <strong>${eventName}</strong> as a guest. 
              Please confirm your email and download the Timely mobile app to get started.
            </p>
            
            <!-- Confirmation Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; 
                        padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px;">
                Confirm Email & Download App
              </a>
            </div>
            
            <!-- Login Details -->
            <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #374151; margin: 0 0 16px; font-size: 18px;">Your Login Details</h3>
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Email:</strong> 
                <span style="color: #6b7280; font-family: monospace;">${email}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #374151;">Password:</strong> 
                <span style="color: #6b7280; font-family: monospace; background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0;">
                Use these credentials to log into the Timely mobile app after confirming your email.
              </p>
            </div>
            
            <!-- App Download Links -->
            <div style="text-align: center; margin: 32px 0;">
              <h3 style="color: #374151; margin: 0 0 16px; font-size: 18px;">Download the App</h3>
              <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
                <a href="https://apps.apple.com/app/timely" 
                   style="display: inline-block; background-color: #000; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold;">
                  📱 iOS App
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.ontimely.app" 
                   style="display: inline-block; background-color: #01875f; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold;">
                  🤖 Android App
                </a>
              </div>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
              <h4 style="color: #92400e; margin: 0 0 8px; font-size: 16px;">Next Steps:</h4>
              <ol style="color: #92400e; margin: 0; padding-left: 20px;">
                <li>Click "Confirm Email & Download App" above</li>
                <li>Download the Timely mobile app</li>
                <li>Open the app and log in with your credentials</li>
                <li>Enjoy your event experience!</li>
              </ol>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have any questions, please contact your event organizer.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
                This email was sent by Timely Event Management System
              </p>
            </div>
            
          </div>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@ontimely.co.uk",
        to: [email],
        subject: `Welcome to ${eventName} • Your Guest Access`,
        html: loginEmailHtml
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: "Failed to send email", details: error });
      }

      return res.status(200).json({ success: true, data });
    }
    
    // Handle form emails (unchanged)
    if (!Array.isArray(emails) || emails.length === 0 || !link || !eventName) {
      return res.status(400).json({ error: "Missing required fields: emails[], link, eventName" });
    }

    const formEmailHtml = `
      <div style="font-family: Arial, sans-serif; padding:24px;">
        <h2 style="margin:0 0 8px;">${eventName}</h2>
        <p style="margin:0 0 14px;">Please complete your form using the link below:</p>
        <p style="margin:0 0 18px;"><a href="${link}" target="_blank">${link}</a></p>
        <p style="font-size:12px;color:#666;margin:0;">If you cannot click the link, copy and paste it into your browser.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@ontimely.co.uk",
      to: emails,
      subject: `${eventName} • Please complete your form`,
      html: formEmailHtml
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email", details: error });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};