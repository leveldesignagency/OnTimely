const { Resend } = require('resend');

// Use your verified domain now that DNS is configured
const FROM_EMAIL = 'noreply@ontimely.co.uk';

// Logo URL - hosted on CDN
const LOGO_URL = 'https://ontimely.co.uk/ontimely-logo-email.png';

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
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
          </head>
          <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
              <tr>
                <td align="left" style="padding: 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
                    <!-- Logo Header -->
                    <tr>
                      <td align="right" style="padding: 30px 40px 20px 40px;">
                        <img src="${LOGO_URL}" alt="OnTimely Logo" width="80" height="80" style="display: block; max-width: 80px; height: auto;" />
                      </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                      <td align="left" style="padding: 0 40px 40px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td>
                              <h1 style="margin: 0 0 30px 0; font-size: 48px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">${eventName}</h1>
                              <p style="margin: 0 0 30px 0; font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.6;">Hi ${guestName},</p>
                              <p style="margin: 0 0 30px 0; font-size: 18px; font-weight: 600; color: #ffffff; line-height: 1.6;">You've been invited to join <strong style="color: #22c55e;">${eventName}</strong> as a guest. Please confirm your email and download the OnTimely mobile app to get started.</p>
                              
                              <!-- Confirmation Button -->
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 40px 0;">
                                <tr>
                                  <td align="left">
                                    <a href="${confirmationUrl}" style="display: inline-block; background-color: #22c55e; color: #000000; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Confirm Email & Download App</a>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Login Credentials -->
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0; background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                                <tr>
                                  <td style="padding: 30px;">
                                    <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #22c55e; text-transform: uppercase;">Login Credentials</h3>
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                      <tr>
                                        <td style="padding-bottom: 15px;">
                                          <strong style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #cbd5e1; text-transform: uppercase;">Email:</strong>
                                          <span style="display: inline-block; font-family: monospace; background-color: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 6px; font-size: 16px; color: #ffffff;">${email}</span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <strong style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #cbd5e1; text-transform: uppercase;">Password:</strong>
                                          <span style="display: inline-block; font-family: monospace; background-color: rgba(34,197,94,0.2); padding: 10px 15px; border-radius: 6px; font-size: 16px; color: #ffffff; border: 1px solid rgba(34,197,94,0.3);">${password}</span>
                                        </td>
                                      </tr>
                                    </table>
                                    <p style="margin: 20px 0 0 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">Use these credentials to log into the OnTimely mobile app after confirming your email.</p>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- App Download Links -->
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                                <tr>
                                  <td align="left">
                                    <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-transform: uppercase;">Download the App</h3>
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                      <tr>
                                        <td style="padding-right: 15px;">
                                          <a href="https://apps.apple.com/app/timely" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 2px solid #ffffff;">📱 iOS App</a>
                                        </td>
                                        <td>
                                          <a href="https://play.google.com/store/apps/details?id=com.ontimely.app" style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">🤖 Android App</a>
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
                </td>
              </tr>
            </table>
          </body>
          </html>
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
    
    // EXISTING: Handle form emails
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
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
            <tr>
              <td align="left" style="padding: 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 100%; background-color: #000000;">
                  <!-- Logo Header -->
                  <tr>
                    <td align="right" style="padding: 30px 40px 20px 40px;">
                      <img src="${LOGO_URL}" alt="OnTimely Logo" width="80" height="80" style="display: block; max-width: 80px; height: auto;" />
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
