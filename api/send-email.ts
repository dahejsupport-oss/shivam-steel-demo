import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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
    } = req.body;

    const isInquirySender = (senderEmail || '').toLowerCase().includes('inquiry');
    const userEmail = (senderEmail || (isInquirySender ? process.env.BREVO_INQUIRY_SENDER_EMAIL : process.env.BREVO_SENDER_EMAIL) || process.env.SMTP_USER || process.env.GMAIL_USER || 'help@dahejsupport.com').trim();
    const cleanPass = (smtpPass || (isInquirySender ? (process.env.BREVO_INQUIRY_API_KEY || process.env.BREVO_API_KEY) : process.env.BREVO_API_KEY) || process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || '').trim().replace(/\s+/g, '');

    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    if (!cleanPass) {
      return res.status(400).json({
        error: 'Email dispatcher key is not configured. Please enter your Brevo API Key in Admin Settings > Email Configuration, or set BREVO_API_KEY in environment variables.'
      });
    }

    const cleanSubject = (subject || 'Proforma Invoice - DAHEJ SUPPORT').trim();
    const plainText = text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'Please find attached your official quotation from DAHEJ SUPPORT.');

    // 1. BREVO REST API (Recommended for 100% Primary Inbox Deliverability)
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

      const brevoData = await brevoRes.json().catch(() => ({}));
      if (brevoRes.ok && (brevoData.messageId || brevoData.id)) {
        return res.status(200).json({ id: brevoData.messageId || brevoData.id, success: true });
      } else {
        const rawMsg = brevoData.message || brevoData.error || '';
        let userFriendlyError = rawMsg;
        if (rawMsg.toLowerCase().includes('key not found') || rawMsg.toLowerCase().includes('unauthorized')) {
          userFriendlyError = 'Brevo API Key is invalid or not found. Please generate a new API key in Brevo (app.brevo.com/settings/keys/api) and paste it into Admin Profile > Email Settings, or use "Open in Gmail Web".';
        } else if (rawMsg.toLowerCase().includes('sender') || rawMsg.toLowerCase().includes('not allowed')) {
          userFriendlyError = `Sender email "${userEmail}" is not verified in your Brevo account. Please verify this sender in Brevo (Senders & IP) or update Sender Email in Admin Profile.`;
        }
        return res.status(brevoRes.status || 400).json({ error: userFriendlyError || 'Brevo API rejected the email.' });
      }
    }

    // 2. SMTP RELAYS (Brevo SMTP or Gmail)
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

    return res.status(200).json({ id: info.messageId, success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
