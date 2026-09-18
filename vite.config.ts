import react from '@vitejs/plugin-react'
import nodemailer from 'nodemailer'
import { defineConfig, type Plugin } from 'vite'

function emailProxyPlugin(): Plugin {
  return {
    name: 'email-dispatcher-proxy',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const {
                to,
                subject,
                text,
                html,
                attachments,
                senderName = 'DAHEJ SUPPORT (Demo)',
                senderEmail = 'help@dahejsupport.com',
                smtpPass = '',
                provider = 'brevo_api'
              } = parsed;

              const isInquirySender = (senderEmail || '').toLowerCase().includes('inquiry');
              const userEmail = (senderEmail || (isInquirySender ? process.env.BREVO_INQUIRY_SENDER_EMAIL : process.env.BREVO_SENDER_EMAIL) || process.env.SMTP_USER || process.env.GMAIL_USER || 'help@dahejsupport.com').trim();
              const cleanPass = (smtpPass || (isInquirySender ? (process.env.BREVO_INQUIRY_API_KEY || process.env.BREVO_API_KEY) : process.env.BREVO_API_KEY) || process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || '').trim().replace(/\s+/g, '');

              if (!to) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Recipient email is required.' }));
                return;
              }

              if (!cleanPass) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Email dispatcher key is not configured. Please enter your Brevo API Key in Admin Settings > Email Configuration.' }));
                return;
              }

              const cleanSubject = (subject || 'Proforma Invoice - DAHEJ SUPPORT').trim();
              const plainText = text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'Please find attached your official quotation from DAHEJ SUPPORT.');

              // 1. BREVO REST API (Recommended for 100% inbox deliverability)
              if (provider === 'brevo_api' || (!provider && cleanPass.startsWith('xkeysib-'))) {
                const brevoAttachments = (attachments || [])
                  .filter((a: { content?: string }) => !!a?.content)
                  .map((a: { filename: string; content: string }) => {
                    let rawBase64 = a.content || '';
                    if (rawBase64.includes(';base64,')) {
                      rawBase64 = rawBase64.split(';base64,').pop() || '';
                    } else {
                      rawBase64 = rawBase64.replace(/^data:.*?;base64,/, '');
                    }
                    return {
                      name: a.filename || 'Dahej_Support_Proforma_Invoice.pdf',
                      content: rawBase64
                    };
                  });

                const brevoPayload: any = {
                  sender: {
                    name: senderName,
                    email: userEmail
                  },
                  to: [
                    {
                      email: to
                    }
                  ],
                  replyTo: {
                    email: userEmail,
                    name: senderName
                  },
                  subject: cleanSubject,
                  htmlContent: html || `<p>${plainText}</p>`,
                  textContent: plainText
                };

                if (brevoAttachments.length > 0) {
                  brevoPayload.attachment = brevoAttachments;
                }

                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                  method: 'POST',
                  headers: {
                    'accept': 'application/json',
                    'api-key': cleanPass,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(brevoPayload)
                });

                const brevoData: any = await brevoRes.json().catch(() => ({}));
                if (brevoRes.ok && (brevoData?.messageId || brevoData?.id)) {
                  res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ id: brevoData.messageId || brevoData.id, success: true }));
                  return;
                } else {
                  const rawMsg = brevoData?.message || brevoData?.error || '';
                  let userFriendlyError = rawMsg;
                  if (rawMsg.toLowerCase().includes('key not found') || rawMsg.toLowerCase().includes('unauthorized')) {
                    userFriendlyError = 'Brevo API Key is invalid or expired. Please generate a new API key in Brevo (app.brevo.com/settings/keys/api) and paste it into Admin Settings > Email Configuration.';
                  } else if (rawMsg.toLowerCase().includes('sender') || rawMsg.toLowerCase().includes('not allowed')) {
                    userFriendlyError = `Sender email "${userEmail}" is not verified in your Brevo account. Please verify this sender in Brevo (Senders & IP) or update Sender Email in Admin Settings.`;
                  }
                  res.writeHead(brevoRes.status || 400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  });
                  res.end(JSON.stringify({ error: userFriendlyError || 'Brevo API rejected the email.' }));
                  return;
                }
              }

              // 2. SMTP RELAY (Brevo SMTP or Gmail)
              let transportOptions: any;
              if (provider === 'brevo_smtp' || !provider) {
                transportOptions = {
                  host: 'smtp-relay.brevo.com',
                  port: 587,
                  secure: false,
                  auth: {
                    user: userEmail,
                    pass: cleanPass
                  }
                };
              } else {
                transportOptions = {
                  service: 'gmail',
                  auth: {
                    user: userEmail,
                    pass: cleanPass
                  }
                };
              }

              const transporter = nodemailer.createTransport(transportOptions);

              const rawAttachments = attachments || [];
              const mailAttachments = rawAttachments.map((a: { filename: string; content: string }) => {
                let rawBase64 = a.content || '';
                if (rawBase64.includes(';base64,')) {
                  rawBase64 = rawBase64.split(';base64,').pop() || '';
                } else {
                  rawBase64 = rawBase64.replace(/^data:.*?;base64,/, '');
                }
                return {
                  filename: a.filename || 'Dahej_Support_Document.pdf',
                  content: Buffer.from(rawBase64, 'base64'),
                  contentType: 'application/pdf'
                };
              });

              const info = await transporter.sendMail({
                from: `"${senderName}" <${userEmail}>`,
                to,
                replyTo: userEmail,
                subject: cleanSubject,
                text: plainText,
                html: html || `<p>${plainText}</p>`,
                attachments: mailAttachments,
                headers: {
                  'X-Priority': '3',
                  'Importance': 'Normal'
                }
              });

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ id: info.messageId, success: true }));
            } catch (err: any) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: err.message || 'Internal proxy error' }));
            }
          });
        } else {
          res.writeHead(405);
          res.end();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emailProxyPlugin()],
})
