const { Resend } = require('resend');

// Use your verified domain now that DNS is configured
const FROM_EMAIL = 'noreply@ontimely.co.uk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }
  
  const resend = new Resend(apiKey);

  try {
    const { emails, link, eventName, emailType, email, password, guestName, confirmationToken } = req.body || {};
    console.log('Received request:', { emails, link, eventName, emailType });
    
    // NEW: Handle login credential emails
    if (emailType === 'login') {
      if (!email || !password || !eventName || !guestName) {
        return res.status(400).json({ error: 'Missing required fields for login email: email, password, eventName, guestName' });
      }
      
      // Use email as confirmation token if not provided (temporary fallback)
      const token = confirmationToken || encodeURIComponent(email);

      const confirmationUrl = `https://ontimely.co.uk/guest-success-email-confirmed?token=${token}`;
      
      const emailPayload = {
        from: `OnTimely <${FROM_EMAIL}>`,
        to: [email],
        subject: `${eventName} • Your Guest Access`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: radial-gradient(1200px 800px at 20% -10%, rgba(34,197,94,0.12), transparent 40%), radial-gradient(1000px 700px at 120% 10%, rgba(34,197,94,0.08), transparent 45%), #0f1115;">
            <div style="background: rgba(17, 24, 39, 0.55); border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 30px rgba(0,0,0,0.45); backdrop-filter: blur(8px); overflow: hidden;">
              
              <!-- Header -->
              <div style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); color: #e5e7eb; padding: 36px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <h1 style="color: #e5e7eb; margin: 0 0 10px; font-size: 2.5rem; font-weight: 700;">${eventName}</h1>
                <h2 style="color: #e5e7eb; margin: 0; font-size: 1.1rem; font-weight: normal; opacity: 0.9;">Welcome to OnTimely</h2>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px;">
                <!-- Greeting -->
                <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Hi ${guestName},
                </p>
                
                <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                  You've been invited to join <strong style="color: #22c55e;">${eventName}</strong> as a guest. 
                  Please confirm your email and download the OnTimely mobile app to get started.
                </p>
                
                <!-- Confirmation Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${confirmationUrl}" 
                     style="display: inline-block; background: linear-gradient(180deg, #22c55e, #16a34a); color: #0b1411; 
                            padding: 16px 32px; text-decoration: none; border-radius: 10px; 
                            font-weight: 700; font-size: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 24px rgba(34,197,94,0.25);">
                    Confirm Email & Download App
                  </a>
                </div>
                
                <!-- Login Credentials -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 10px; margin: 24px 0;">
                  <h3 style="color: #22c55e; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Login Credentials</h3>
                  <div style="margin-bottom: 16px;">
                    <strong style="color: #cbd5e1; display: block; margin-bottom: 4px;">Email:</strong> 
                    <span style="color: #e5e7eb; font-family: monospace; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; display: inline-block;">${email}</span>
                  </div>
                  <div style="margin-bottom: 16px;">
                    <strong style="color: #cbd5e1; display: block; margin-bottom: 4px;">Password:</strong> 
                    <span style="color: #e5e7eb; font-family: monospace; background: rgba(34,197,94,0.2); padding: 8px 12px; border-radius: 6px; display: inline-block; border: 1px solid rgba(34,197,94,0.3);">${password}</span>
                  </div>
                  <p style="color: #9ca3af; font-size: 14px; margin: 16px 0 0; line-height: 1.5;">
                    Use these credentials to log into the OnTimely mobile app after confirming your email.
                  </p>
                </div>
                
                <!-- App Download Links -->
                <div style="text-align: center; margin: 32px 0;">
                  <h3 style="color: #e5e7eb; margin: 0 0 20px; font-size: 18px; font-weight: 600;">Download the App</h3>
                  <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
                    <a href="https://apps.apple.com/app/timely" 
                       style="display: inline-flex; align-items: center; background-color: #000; color: white; 
                              padding: 12px 20px; text-decoration: none; border-radius: 10px; 
                              font-weight: 600; font-size: 14px; transition: all 0.2s ease;">
                      <span style="margin-right: 8px; font-size: 16px;">🍎</span>
                      iOS App
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.ontimely.app" 
                       style="display: inline-flex; align-items: center; background-color: #fff; color: #000; 
                              padding: 12px 20px; text-decoration: none; border-radius: 10px; 
                              font-weight: 600; font-size: 14px; transition: all 0.2s ease;">
                      <span style="margin-right: 8px; font-size: 16px;">📱</span>
                      Android App
                    </a>
                  </div>
                </div>
                
                <!-- Next Steps -->
                <div style="background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); padding: 20px; border-radius: 10px; margin: 24px 0;">
                  <h4 style="color: #22c55e; margin: 0 0 16px; font-size: 16px; font-weight: 600; text-align: center;">Next Steps:</h4>
                  <ol style="color: #e5e7eb; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">Click "Confirm Email & Download App" above</li>
                    <li style="margin-bottom: 8px;">Download the OnTimely mobile app using the links above</li>
                    <li style="margin-bottom: 8px;">Open the app and log in with your credentials</li>
                    <li style="margin-bottom: 0;">Enjoy your event experience!</li>
                  </ol>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
                  <p style="color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.5;">
                    If you have any questions, please contact your event organizer.
                  </p>
                  <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
                    This email was sent by OnTimely Event Management Systems
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        `,
      };

      console.log('Sending login email with payload:', { ...emailPayload, html: 'HTML_CONTENT_HIDDEN' });
      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        console.error('Resend error:', error);
        return res.status(400).json(error);
      }

      console.log('Login email sent successfully:', data);
      return res.status(200).json(data);
    }
    
    // EXISTING: Handle form emails (unchanged)
    if (!Array.isArray(emails) || emails.length === 0 || !link || !eventName) {
      return res.status(400).json({ error: 'Missing required fields: emails[], link, eventName' });
    }

    const emailPayload = {
      from: `OnTimely <${FROM_EMAIL}>`,
      to: emails,
      subject: `${eventName} • Please complete your form`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background-color: #000000;
              color: #ffffff;
              line-height: 1.6;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #000000;
              position: relative;
            }
            .logo-container {
              position: absolute;
              top: 20px;
              right: 20px;
              width: 80px;
              height: 80px;
            }
            .logo-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .content-area {
              padding: 60px 40px 40px;
              text-align: left;
            }
            .event-title {
              color: #ffffff;
              font-size: 32px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 24px;
              line-height: 1.2;
            }
            .content-text {
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 32px;
              line-height: 1.6;
            }
            .button-container {
              margin: 32px 0;
            }
            .button {
              display: inline-block;
              background-color: #22c55e;
              color: #000000;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 700;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .link-fallback {
              border: 2px solid #22c55e;
              padding: 20px;
              margin-top: 32px;
            }
            .link-fallback-text {
              color: #ffffff;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              margin-bottom: 12px;
              line-height: 1.5;
            }
            .link-fallback-url {
              color: #ffffff;
              font-size: 12px;
              font-weight: 600;
              word-break: break-all;
              line-height: 1.6;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                padding: 20px;
              }
              .logo-container {
                top: 10px;
                right: 10px;
                width: 60px;
                height: 60px;
              }
              .content-area {
                padding: 80px 20px 20px;
                text-align: center;
              }
              .event-title {
                font-size: 24px;
                text-align: center;
              }
              .content-text {
                text-align: center;
                font-size: 14px;
              }
              .button-container {
                text-align: center;
              }
              .button {
                display: block;
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
              }
              .link-fallback {
                text-align: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="logo-container">
              <img src="data:image/png;base64,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" alt="OnTimely Logo" />
            </div>
            <div class="content-area">
              <h1 class="event-title">${eventName}</h1>
              <p class="content-text">Please complete your form using the link below:</p>
              <div class="button-container">
                <a href="${link}" target="_blank" class="button">Complete Your Form</a>
              </div>
              <div class="link-fallback">
                <p class="link-fallback-text">If you cannot click the button, copy and paste this link into your browser:</p>
                <p class="link-fallback-url">${link}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('Sending email with payload:', emailPayload);

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json(error);
    }

    console.log('Resend success:', data);
    return res.status(200).json(data);
  } catch (e) {
    console.error('Edge Function error:', e);
    return res.status(500).json({ error: 'Failed to send email', details: e.message });
  }
}
