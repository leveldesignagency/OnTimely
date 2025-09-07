const { Resend } = require('resend');

// Use your verified domain now that DNS is configured
const FROM_EMAIL = 'noreply@ontimely.co.uk';

module.exports = async (req, res) => {
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: radial-gradient(1200px 800px at 20% -10%, rgba(34,197,94,0.12), transparent 40%), radial-gradient(1000px 700px at 120% 10%, rgba(34,197,94,0.08), transparent 45%), #0f1115;">
          <div style="background: rgba(17, 24, 39, 0.55); border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 30px rgba(0,0,0,0.45); backdrop-filter: blur(8px); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); color: #e5e7eb; padding: 36px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <h1 style="color: #e5e7eb; margin: 0 0 10px; font-size: 2.5rem; font-weight: 700;">${eventName}</h1>
              <h2 style="color: #e5e7eb; margin: 0; font-size: 1.1rem; font-weight: normal; opacity: 0.9;">Welcome to OnTimely</h2>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Please complete your form using the link below:
              </p>
              
              <!-- Form Link Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${link}" target="_blank"
                   style="display: inline-block; background: linear-gradient(180deg, #22c55e, #16a34a); color: #0b1411; 
                          padding: 16px 32px; text-decoration: none; border-radius: 10px; 
                          font-weight: 700; font-size: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 24px rgba(34,197,94,0.25);">
                  Complete Your Form
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 10px; margin: 24px 0;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0 0 12px; font-weight: 600;">Alternative Link:</p>
                <p style="color: #e5e7eb; font-family: monospace; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; margin: 0; word-break: break-all;">${link}</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0; line-height: 1.5;">
                  If you cannot click the button above, copy and paste this link into your browser.
                </p>
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
};
