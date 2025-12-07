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
      
      // No confirmation needed - guests are auto-confirmed
      const appDownloadUrl = 'https://guest.ontimely.co.uk/app-download';
      
      const loginEmailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="icon" type="image/x-icon" href="${FAVICON_URL}">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background-color: #1a1a1a;
              color: #e5e7eb;
              line-height: 1.6;
              padding: 40px 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #2a2a2a;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.4);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
              padding: 40px;
              text-align: center;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .avatar-placeholder {
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background-color: #22c55e;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid rgba(34, 197, 94, 0.3);
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(34, 197, 94, 0.2);
            }
            .avatar-placeholder img {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              object-fit: cover;
            }
            .header h1 {
              color: #e5e7eb;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header h2 {
              color: #22c55e;
              font-size: 20px;
              font-weight: 500;
            }
            .content {
              padding: 40px;
            }
            .content p {
              color: #cbd5e1;
              font-size: 16px;
              margin-bottom: 16px;
            }
            .credentials-box {
              background-color: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.2);
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .credentials-box h3 {
              color: #22c55e;
              margin: 0 0 16px;
              font-size: 18px;
              font-weight: 600;
            }
            .credential-row {
              margin-bottom: 16px;
            }
            .credential-row strong {
              color: #cbd5e1;
              display: block;
              margin-bottom: 4px;
              font-size: 14px;
            }
            .credential-value {
              color: #e5e7eb;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              background-color: rgba(255, 255, 255, 0.05);
              padding: 10px 14px;
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              display: inline-block;
            }
            .app-download-section {
              background-color: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.2);
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              text-align: center;
            }
            .app-download-section h3 {
              color: #22c55e;
              margin: 0 0 20px;
              font-size: 18px;
              font-weight: 600;
            }
            .app-links {
              display: flex;
              justify-content: center;
              gap: 16px;
              flex-wrap: wrap;
            }
            .app-link {
              display: inline-block;
              padding: 12px 20px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 14px;
            }
            .app-link.ios {
              background-color: #000;
              color: white;
            }
            .app-link.android {
              background: linear-gradient(135deg, #22c55e, #16a34a);
              color: #0b1411;
            }
            .instructions {
              background-color: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.2);
              border-left: 4px solid #22c55e;
              padding: 20px;
              border-radius: 8px;
              margin: 24px 0;
            }
            .instructions h4 {
              color: #22c55e;
              margin: 0 0 12px;
              font-size: 16px;
              font-weight: 600;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              color: #cbd5e1;
              margin-bottom: 8px;
              font-size: 15px;
            }
            .footer {
              background-color: #1a1a1a;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .footer p {
              color: #9ca3af;
              font-size: 14px;
              margin-bottom: 8px;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 20px 10px; }
              .email-container { border-radius: 12px; }
              .header, .content, .footer { padding: 30px 20px; text-align: center; }
              .header h1 { font-size: 24px; }
              .content p { text-align: center; font-size: 15px; }
              .credentials-box { text-align: center; }
              .app-links { flex-direction: column; align-items: center; }
              .app-link { width: 100%; max-width: 280px; }
              .instructions { text-align: left; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="avatar-placeholder">
                <img src="data:image/png;base64,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" alt="OnTimely Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain; padding: 8px;" />
              </div>
              <h1>Welcome to Timely</h1>
              <h2>${eventName}</h2>
            </div>
            
            <div class="content">
              <p>Hi ${guestName},</p>
              <p>You've been invited to join <strong style="color: #22c55e;">${eventName}</strong> as a guest. Your account is ready! Download the Timely mobile app and log in with your credentials below.</p>
              
              <div class="credentials-box">
                <h3>Your Login Details</h3>
                <div class="credential-row">
                  <strong>Email:</strong>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-row">
                  <strong>Password:</strong>
                  <span class="credential-value" style="background-color: rgba(34, 197, 94, 0.2); border-color: rgba(34, 197, 94, 0.3);">${password}</span>
                </div>
                <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0;">
                  Use these credentials to log into the Timely mobile app. Your account is ready to use!
                </p>
              </div>
              
              <div class="app-download-section">
                <h3>Download the App</h3>
                <div class="app-links">
                  <a href="https://apps.apple.com/app/timely" class="app-link ios">📱 iOS App</a>
                  <a href="https://play.google.com/store/apps/details?id=com.ontimely.app" class="app-link android">🤖 Android App</a>
                </div>
              </div>
              
              <div class="instructions">
                <h4>Next Steps:</h4>
                <ol>
                  <li>Download the Timely mobile app using the links above</li>
                  <li>Open the app and log in with your credentials</li>
                  <li>Enjoy your event experience!</li>
                </ol>
              </div>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact your event organizer.</p>
              <p>This email was sent by Timely Event Management System</p>
            </div>
          </div>
        </body>
        </html>
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

    // Logo and Favicon URLs - hosted on CDN (Vercel automatically serves files from /website folder)
    const LOGO_URL = 'https://ontimely.co.uk/on-timely-official-logo-email.png'; // Logo in email top left
    const FAVICON_URL = 'https://ontimely.co.uk/ontimely-favicon-email.png'; // Email avatar/profile photo
    
    const formEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <link rel="icon" type="image/x-icon" href="${FAVICON_URL}">
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
          <tr>
            <td align="left" style="padding: 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
                <!-- Logo Header -->
                <tr>
                  <td align="left" style="padding: 30px 40px 20px 40px;">
                    <img src="${LOGO_URL}" alt="OnTimely Logo" width="120" height="auto" style="display: block; max-width: 120px; height: auto;" />
                  </td>
                </tr>
                <!-- Main Content -->
                <tr>
                  <td align="left" style="padding: 0 40px 60px 40px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h1 style="margin: 0 0 30px 0; font-size: 48px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">${eventName}</h1>
                          <p style="margin: 0 0 40px 0; font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.6;">Please complete your form using the link below:</p>
                          
                          <!-- Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 40px 0;">
                            <tr>
                              <td align="left">
                                <a href="${link}" target="_blank" style="display: inline-block; background-color: #22c55e; color: #000000; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Complete Your Form</a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Link Fallback -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0; border: 2px solid #22c55e; border-radius: 8px;">
                            <tr>
                              <td style="padding: 30px;">
                                <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: #ffffff; text-transform: uppercase; line-height: 1.5;">If you cannot click the button, copy and paste this link into your browser:</p>
                                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #ffffff; word-break: break-all; line-height: 1.6; font-family: monospace;">${link}</p>
                              </td>
                            </tr>
                          </table>
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