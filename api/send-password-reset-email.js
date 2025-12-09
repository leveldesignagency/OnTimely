const { Resend } = require('resend');

// Use your verified domain now that DNS is configured
const FROM_EMAIL = 'noreply@ontimely.co.uk';

module.exports = async (req, res) => {
  console.log('🚀 send-password-reset-email API called');
  console.log('📥 Method:', req.method);
  console.log('📥 Headers:', req.headers);
  console.log('📥 Body:', req.body);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }
  
  const resend = new Resend(apiKey);

  try {
    const { email, name, resetUrl } = req.body || {};
    console.log('📧 Received password reset request:', { email, name, resetUrl });
    
    if (!email || !name || !resetUrl) {
      return res.status(400).json({ error: 'Missing required fields: email, name, resetUrl' });
    }

    const emailPayload = {
      from: `OnTimely <${FROM_EMAIL}>`,
      to: [email],
      subject: `Reset Your OnTimely Password`,
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
            .header p {
              color: #9ca3af;
              font-size: 14px;
            }
            .content {
              padding: 40px;
            }
            .content p {
              color: #cbd5e1;
              font-size: 16px;
              margin-bottom: 16px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #22c55e, #16a34a);
              color: #0b1411;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 700;
              font-size: 16px;
              margin: 24px 0;
              text-align: center;
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(34, 197, 94, 0.3);
            }
            .link-fallback {
              background-color: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .link-fallback p {
              color: #9ca3af;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .link-fallback a {
              color: #22c55e;
              word-break: break-all;
              font-size: 12px;
            }
            .security-note {
              background-color: rgba(255, 193, 7, 0.1);
              border: 1px solid rgba(255, 193, 7, 0.2);
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .security-note p {
              color: #fbbf24;
              font-size: 14px;
              margin: 0;
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
              .button { display: block; width: 100%; max-width: 280px; margin: 24px auto; }
              .link-fallback { text-align: center; }
              .security-note { text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="avatar-placeholder">
                <img src="data:image/png;base64,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" alt="OnTimely Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain; padding: 8px;" />
              </div>
              <h1>Reset Your Password</h1>
              <p>OnTimely Account</p>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="link-fallback">
                <p>If the button doesn't work, copy this link:</p>
                <a href="${resetUrl}">${resetUrl}</a>
              </div>
              
              <div class="security-note">
                <p>⚠️ This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.</p>
              </div>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact your account administrator.</p>
              <p>This email was sent by OnTimely Event Management Systems</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending password reset email with payload:', { ...emailPayload, html: 'HTML_CONTENT_HIDDEN' });
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('❌ Resend error:', error);
      return res.status(400).json(error);
    }

    console.log('✅ Password reset email sent successfully:', data);
    return res.status(200).json(data);
  } catch (e) {
    console.error('❌ Password reset email error:', e);
    return res.status(500).json({ error: 'Failed to send password reset email', details: e.message });
  }
};

