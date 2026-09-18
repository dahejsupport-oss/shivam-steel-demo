import { supabase } from '../supabaseClient';

export type EmailProvider = 'brevo_api' | 'brevo_smtp' | 'gmail';

export interface EmailConfig {
  senderEmail: string;
  senderName: string;
  smtpPass: string; // Brevo API key (e.g. xkeysib-...) or Brevo SMTP key
  provider?: EmailProvider;
}

export interface InquiryEmailConfig extends EmailConfig {
  adminNotificationEmail?: string;
}

// 1. INVOICE / ORDER DISPATCHER CONFIG
const LOCAL_EMAIL_CONFIG_KEY = 'shivam_steel_email_config';

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  senderEmail: 'help@dahejsupport.com',
  senderName: 'DAHEJ SUPPORT (Demo)',
  smtpPass: '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',
  provider: 'brevo_api'
};

export function getEmailConfig(): EmailConfig {
  try {
    const saved = localStorage.getItem(LOCAL_EMAIL_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_EMAIL_CONFIG,
        ...parsed,
        smtpPass: parsed.smtpPass ?? DEFAULT_EMAIL_CONFIG.smtpPass,
        senderEmail: parsed.senderEmail || DEFAULT_EMAIL_CONFIG.senderEmail,
        senderName: parsed.senderName || DEFAULT_EMAIL_CONFIG.senderName,
        provider: parsed.provider || DEFAULT_EMAIL_CONFIG.provider
      };
    }
  } catch {}
  return DEFAULT_EMAIL_CONFIG;
}

export async function fetchEmailConfigFromCloud(): Promise<EmailConfig> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'email_config')
      .maybeSingle();

    if (!error && data?.value) {
      const cloudCfg = data.value as EmailConfig;
      if (cloudCfg.smtpPass && cloudCfg.smtpPass.trim().length > 0) {
        const merged: EmailConfig = {
          ...DEFAULT_EMAIL_CONFIG,
          ...cloudCfg
        };
        localStorage.setItem(LOCAL_EMAIL_CONFIG_KEY, JSON.stringify(merged));
        return merged;
      }
    }

    // If cloud does NOT have an active key, but this device's localStorage DOES,
    // automatically sync local config to Supabase so that all other devices get it immediately!
    const localCfg = getEmailConfig();
    if (localCfg.smtpPass && localCfg.smtpPass.trim().length > 0) {
      (async () => {
        try {
          await supabase
            .from('admin_settings')
            .upsert({
              key: 'email_config',
              value: localCfg,
              updated_at: new Date().toISOString()
            });
        } catch (err) {
          console.warn('Could not auto-sync local email config to cloud:', err);
        }
      })();
      return localCfg;
    }
  } catch (err) {
    console.warn('Could not fetch email config from cloud:', err);
  }
  return getEmailConfig();
}

export async function saveEmailConfig(config: EmailConfig): Promise<void> {
  localStorage.setItem(LOCAL_EMAIL_CONFIG_KEY, JSON.stringify(config));
  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'email_config',
        value: config,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.warn('Could not sync email config to cloud table:', error.message);
    }
  } catch (err) {
    console.warn('Error syncing email config to cloud:', err);
  }
}

// 2. DEDICATED INQUIRY AUTO-RESPONDER CONFIG (help@dahejsupport.com)
const LOCAL_INQUIRY_EMAIL_CONFIG_KEY = 'shivam_steel_inquiry_email_config';

export const DEFAULT_INQUIRY_EMAIL_CONFIG: InquiryEmailConfig = {
  senderEmail: 'help@dahejsupport.com',
  senderName: 'Dahej Support (Inquiry Desk)',
  smtpPass: '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',
  provider: 'brevo_api',
  adminNotificationEmail: 'dahejsupport@gmail.com'
};

export function getInquiryEmailConfig(): InquiryEmailConfig {
  try {
    const saved = localStorage.getItem(LOCAL_INQUIRY_EMAIL_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const adminEmail = parsed.adminNotificationEmail !== undefined ? parsed.adminNotificationEmail : DEFAULT_INQUIRY_EMAIL_CONFIG.adminNotificationEmail;
      return {
        ...DEFAULT_INQUIRY_EMAIL_CONFIG,
        ...parsed,
        smtpPass: parsed.smtpPass ?? DEFAULT_INQUIRY_EMAIL_CONFIG.smtpPass,
        senderEmail: parsed.senderEmail || DEFAULT_INQUIRY_EMAIL_CONFIG.senderEmail,
        senderName: parsed.senderName || DEFAULT_INQUIRY_EMAIL_CONFIG.senderName,
        provider: parsed.provider || DEFAULT_INQUIRY_EMAIL_CONFIG.provider,
        adminNotificationEmail: adminEmail
      };
    }
  } catch {}
  return DEFAULT_INQUIRY_EMAIL_CONFIG;
}

export async function fetchInquiryEmailConfigFromCloud(): Promise<InquiryEmailConfig> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'inquiry_email_config')
      .maybeSingle();

    if (!error && data?.value) {
      const cloudCfg = data.value as InquiryEmailConfig;
      if (cloudCfg.smtpPass && cloudCfg.smtpPass.trim().length > 0) {
        const adminEmail = cloudCfg.adminNotificationEmail !== undefined ? cloudCfg.adminNotificationEmail : DEFAULT_INQUIRY_EMAIL_CONFIG.adminNotificationEmail;
        const merged: InquiryEmailConfig = {
          ...DEFAULT_INQUIRY_EMAIL_CONFIG,
          ...cloudCfg,
          adminNotificationEmail: adminEmail
        };
        localStorage.setItem(LOCAL_INQUIRY_EMAIL_CONFIG_KEY, JSON.stringify(merged));
        return merged;
      }
    }

    // Auto-sync local inquiry config to cloud if missing in cloud
    const localInq = getInquiryEmailConfig();
    if (localInq.smtpPass && localInq.smtpPass.trim().length > 0) {
      (async () => {
        try {
          await supabase
            .from('admin_settings')
            .upsert({
              key: 'inquiry_email_config',
              value: localInq,
              updated_at: new Date().toISOString()
            });
        } catch (err) {
          console.warn('Could not auto-sync local inquiry config to cloud:', err);
        }
      })();
      return localInq;
    }
  } catch (err) {
    console.warn('Could not fetch inquiry email config from cloud:', err);
  }
  return getInquiryEmailConfig();
}

export async function saveInquiryEmailConfig(config: InquiryEmailConfig): Promise<void> {
  localStorage.setItem(LOCAL_INQUIRY_EMAIL_CONFIG_KEY, JSON.stringify(config));
  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'inquiry_email_config',
        value: config,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.warn('Could not sync inquiry email config to cloud table:', error.message);
    }
  } catch (err) {
    console.warn('Error syncing inquiry email config to cloud:', err);
  }
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
  pdfBase64?: string;
  pdfFileName?: string;
}

/**
 * Low-level dispatch engine supporting both Serverless Proxy & Direct Client-side Brevo REST API fallback
 */
async function dispatchEmailWithConfig(
  payload: SendEmailPayload,
  config: EmailConfig
): Promise<{ success: boolean; message: string }> {
  if (!payload.to || !payload.to.includes('@')) {
    return { success: false, message: 'Invalid recipient email address.' };
  }

  // Fallback if inquiry-specific smtpPass is not set, try main smtpPass
  let effectivePass = (config.smtpPass || getEmailConfig().smtpPass || '').trim().replace(/\s+/g, '');
  let effectiveSenderEmail = (config.senderEmail || DEFAULT_EMAIL_CONFIG.senderEmail).trim();
  let effectiveSenderName = (config.senderName || DEFAULT_EMAIL_CONFIG.senderName).trim();
  let effectiveProvider = config.provider || 'brevo_api';

  // If effectivePass is still empty, attempt on-the-fly cloud fetch
  if (!effectivePass) {
    try {
      const cloudCfg = await fetchEmailConfigFromCloud();
      if (cloudCfg.smtpPass) {
        effectivePass = cloudCfg.smtpPass.trim().replace(/\s+/g, '');
        effectiveSenderEmail = (cloudCfg.senderEmail || effectiveSenderEmail).trim();
        effectiveSenderName = (cloudCfg.senderName || effectiveSenderName).trim();
        effectiveProvider = cloudCfg.provider || effectiveProvider;
      }
    } catch {}
  }

  if (!effectivePass) {
    try {
      const inqCfg = await fetchInquiryEmailConfigFromCloud();
      if (inqCfg.smtpPass) {
        effectivePass = inqCfg.smtpPass.trim().replace(/\s+/g, '');
        effectiveSenderEmail = (inqCfg.senderEmail || effectiveSenderEmail).trim();
        effectiveSenderName = (inqCfg.senderName || effectiveSenderName).trim();
        effectiveProvider = inqCfg.provider || effectiveProvider;
      }
    } catch {}
  }

  try {
    let cleanBase64 = payload.pdfBase64 || '';
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,').pop() || '';
    } else {
      cleanBase64 = cleanBase64.replace(/^data:.*?;base64,/, '');
    }

    const attachments = payload.pdfBase64 ? [
      {
        filename: payload.pdfFileName || 'Shivam_Steel_Document.pdf',
        content: cleanBase64
      }
    ] : [];

    const emailHtml = payload.html || `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${payload.subject}</title></head>
<body style="font-family: sans-serif; padding: 20px; color: #334155;">
  <p>${payload.body.replace(/\n/g, '<br/>')}</p>
</body>
</html>`;

    let lastErrorMsg = '';

    // 1. Try sending through backend /api/send-email serverless endpoint
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
          html: emailHtml,
          attachments,
          senderName: effectiveSenderName,
          senderEmail: effectiveSenderEmail,
          smtpPass: effectivePass,
          provider: effectiveProvider
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok && (resData.id || resData.success || resData.messageId)) {
        return {
          success: true,
          message: `Email successfully dispatched to ${payload.to}!`
        };
      } else if (resData.error) {
        lastErrorMsg = resData.error;
      }
    } catch (proxyErr: any) {
      lastErrorMsg = proxyErr.message || 'Backend dispatcher unavailable.';
    }

    // 2. Direct Client-Side Fallback for Brevo REST API if API key is provided
    if (effectivePass && (effectiveProvider === 'brevo_api' || effectivePass.startsWith('xkeysib-'))) {
      try {
        const brevoPayload: any = {
          sender: {
            name: effectiveSenderName,
            email: effectiveSenderEmail
          },
          to: [{ email: payload.to }],
          replyTo: {
            email: effectiveSenderEmail,
            name: effectiveSenderName
          },
          subject: payload.subject,
          htmlContent: emailHtml,
          textContent: payload.body
        };

        if (attachments && attachments.length > 0 && attachments[0].content) {
          brevoPayload.attachment = attachments.map(a => ({
            name: a.filename,
            content: a.content
          }));
        }

        const brevoDirectRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': effectivePass,
            'content-type': 'application/json'
          },
          body: JSON.stringify(brevoPayload)
        });

        const brevoData = await brevoDirectRes.json().catch(() => ({}));
        if (brevoDirectRes.ok && (brevoData.messageId || brevoData.id)) {
          return {
            success: true,
            message: `Email successfully delivered to ${payload.to} via Brevo Direct!`
          };
        } else if (brevoData.message || brevoData.error) {
          const rawMsg = brevoData.message || brevoData.error || '';
          if (rawMsg.toLowerCase().includes('key not found') || rawMsg.toLowerCase().includes('unauthorized')) {
            lastErrorMsg = 'Brevo API Key is invalid. Please verify the Brevo API key in Admin Settings > Email Configuration.';
          } else if (rawMsg.toLowerCase().includes('sender') || rawMsg.toLowerCase().includes('not allowed')) {
            lastErrorMsg = `Sender email "${effectiveSenderEmail}" is not verified in your Brevo account. Please verify this sender in Brevo (Senders & IP) or update Sender Email in Admin Settings.`;
          } else {
            lastErrorMsg = rawMsg;
          }
        }
      } catch (directErr: any) {
        lastErrorMsg = directErr.message || 'Direct Brevo dispatch failed.';
      }
    }

    if (!effectivePass) {
      return {
        success: false,
        message: 'Email dispatcher key is not set. Please configure Brevo API Key in Admin Settings > Email Configuration.'
      };
    }

    return {
      success: false,
      message: lastErrorMsg || 'Email delivery failed. Please check Brevo configuration.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Email dispatch failed.' };
  }
}

/**
 * Dispatch automated invoice/proforma email via help@dahejsupport.com
 */
export async function sendDirectClientEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
  let config = getEmailConfig();

  // If local config has no smtpPass, proactively fetch cloud email config
  if (!config.smtpPass || config.smtpPass.trim().length === 0) {
    try {
      const cloudCfg = await fetchEmailConfigFromCloud();
      if (cloudCfg && cloudCfg.smtpPass) {
        config = cloudCfg;
      }
    } catch {}
  }

  // If still missing, check inquiry email config from cloud as fallback
  if (!config.smtpPass || config.smtpPass.trim().length === 0) {
    try {
      const inqCfg = await fetchInquiryEmailConfigFromCloud();
      if (inqCfg && inqCfg.smtpPass) {
        config = {
          ...config,
          smtpPass: inqCfg.smtpPass,
          provider: inqCfg.provider || config.provider
        };
      }
    } catch {}
  }

  // Build clean paragraphs
  const paragraphs = (payload.html || payload.body)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p style="margin: 0 0 12px 0; color: #334155; font-size: 14px; line-height: 1.6; word-break: break-word;">${line}</p>`)
    .join('');

  const emailHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${payload.subject || 'Proforma Invoice - DAHEJ SUPPORT'}</title>
  <style>
    * { box-sizing: border-box !important; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px 4px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 6px !important; }
      .header-pad { padding: 18px 16px !important; }
      .body-pad { padding: 18px 14px !important; }
      .footer-pad { padding: 14px 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 16px 8px; width: 100%;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td class="header-pad" style="background-color: #00286a; padding: 22px 24px; border-bottom: 3px solid #f59e0b;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2;">DAHEJ SUPPORT</h1>
                    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-weight: 500; line-height: 1.4;">Industrial Steel & Building Materials Supplier · Dahej, Gujarat</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td class="body-pad" style="padding: 24px 22px; background-color: #ffffff;">
              ${paragraphs}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="background-color: #f8fafc; padding: 16px 22px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 11.5px; color: #64748b; line-height: 1.6; word-break: break-word;">
                    <strong style="color: #00286a;">DAHEJ SUPPORT · DAHEJ</strong><br>
                    Office: G/F/02, Rushiraj Complex, Rahiyad Chokdi, Dahej Road, Ta-Vagra, Dist. Bharuch, Gujarat - 392130<br>
                    Direct Sales Hotline: +91 96015 74966 · Email: ${config.senderEmail || 'help@dahejsupport.com'}<br>
                    GSTIN: 24BCSPP4924R1ZN
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
</html>`;

  return await dispatchEmailWithConfig({ ...payload, html: emailHtml }, config);
}

export interface InquiryConfirmationData {
  id: string;
  type: 'single' | 'bulk' | 'contact';
  name: string;
  company?: string;
  phone: string;
  email: string;
  gst?: string;
  category?: string;
  requirement?: string;
  size?: string;
  message?: string;
  quantity?: number;
  unit?: string;
  hasCustomItems?: boolean;
  items?: Array<{ name: string; quantity: number; unit: string; size?: string; isCustom?: boolean; category?: string }>;
  timestamp: string;
}

/**
 * Dispatch automated inquiry confirmation email to customer AND lead alert to Admin
 */
export async function sendInquiryConfirmationEmail(
  inquiry: InquiryConfirmationData
): Promise<{ success: boolean; message: string }> {
  let config = getInquiryEmailConfig();
  try {
    const cloudCfg = await fetchInquiryEmailConfigFromCloud();
    if (cloudCfg) {
      config = cloudCfg;
    }
  } catch (err) {
    console.warn('Could not load cloud inquiry email config, using local fallback:', err);
  }

  // Helper for requirement details
  let requirementDetailsHtml = '';
  if (inquiry.type === 'single') {
    requirementDetailsHtml = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin: 12px 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="table-layout: fixed; width: 100%; font-size: 13px; color: #334155; word-break: break-word;">
          ${inquiry.category ? `
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0;">Material Category:</td>
            <td style="padding: 4px 0;"><span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px; border: 1px solid #bae6fd;">${inquiry.category}</span></td>
          </tr>` : ''}
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0;">Material / Product:</td>
            <td style="padding: 4px 0;"><strong style="color: #00286a; font-size: 14px;">${inquiry.requirement || 'Steel Material'}</strong></td>
          </tr>
          ${inquiry.size ? `
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0;">Size / Dimension:</td>
            <td style="padding: 4px 0;"><span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a;">${inquiry.size}</span></td>
          </tr>` : ''}
          ${inquiry.quantity ? `
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 4px 0;">Estimated Quantity:</td>
            <td style="padding: 4px 0;"><strong style="color: #1e293b;">${inquiry.quantity} ${inquiry.unit || 'MT'}</strong></td>
          </tr>` : ''}
        </table>
      </div>
    `;
  } else if (inquiry.type === 'bulk' && inquiry.items && inquiry.items.length > 0) {
    const tableRows = inquiry.items.map(it => {
      const isCustom = it.isCustom || (typeof it.name === 'string' && it.name.includes('[Custom]')) || it.category === 'Custom Sourcing';
      const cleanName = typeof it.name === 'string' ? it.name.replace(/^✨\s*\[Custom\]\s*/i, '').replace(/^\[Custom\]\s*/i, '') : it.name;
      return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${isCustom ? 'background-color: #faf5ff;' : ''}">
        <td style="padding: 8px 10px; font-size: 13px; color: ${isCustom ? '#6d28d9' : '#1e293b'}; font-weight: 600; word-break: break-word;">
          ${cleanName}
          ${isCustom ? '<span style="display: inline-block; margin-left: 6px; font-size: 10px; background-color: #f3e8ff; color: #7c3aed; border: 1px solid #d8b4fe; padding: 1px 5px; border-radius: 3px;">✨ Custom</span>' : ''}
          ${it.size ? ` <span style="font-size: 11.5px; color: #d97706;">(${it.size})</span>` : ''}
        </td>
        <td style="padding: 8px 10px; font-size: 13px; color: #00286a; text-align: right; font-weight: 700; white-space: nowrap;">${it.quantity} ${it.unit}</td>
      </tr>
    `;
    }).join('');

    requirementDetailsHtml = `
      <div style="margin: 12px 0; overflow-x: auto;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed; width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 8px 10px; font-size: 12px; color: #475569; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Product Material</th>
              <th style="padding: 8px 10px; font-size: 12px; color: #475569; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; width: 40%;">Requirement</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  } else {
    requirementDetailsHtml = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; margin: 12px 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="table-layout: fixed; width: 100%; font-size: 13px; color: #334155; word-break: break-word;">
          ${inquiry.category ? `
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">Category:</td>
            <td style="padding: 4px 0;"><strong style="color: #0369a1;">${inquiry.category}</strong></td>
          </tr>` : ''}
          ${inquiry.requirement ? `
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">Subject / Topic:</td>
            <td style="padding: 4px 0;"><strong style="color: #00286a;">${inquiry.requirement}</strong></td>
          </tr>` : ''}
          ${inquiry.size ? `
          <tr>
            <td width="38%" style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">Size / Spec:</td>
            <td style="padding: 4px 0;"><strong style="color: #b45309;">${inquiry.size}</strong></td>
          </tr>` : ''}
          ${inquiry.message ? `
          <tr>
            <td style="color: #64748b; font-weight: 600; padding: 4px 0; vertical-align: top;">Message:</td>
            <td style="padding: 4px 0; color: #1e293b; line-height: 1.5; overflow-wrap: anywhere;">${inquiry.message}</td>
          </tr>` : ''}
        </table>
      </div>
    `;
  }

  let clientResult: { success: boolean; message: string } = { success: true, message: '' };

  // 1. DISPATCH CONFIRMATION EMAIL TO CLIENT IF VALID EMAIL GIVEN
  if (inquiry.email && inquiry.email.includes('@')) {
    const subject = `Inquiry Received - DAHEJ SUPPORT (Ref: #${inquiry.id.replace('inq-', '').replace('cq-', '')})`;
    const plainText = `Dear ${inquiry.name},

Thank you for your sourcing inquiry with DAHEJ SUPPORT (Dahej).

Your requirement has been successfully registered and forwarded to our sales and pricing desk.

Our executive will review live stockyard rates & dispatch schedules and contact you within 24 hours (or sooner during business hours).

Inquiry Reference: #${inquiry.id}
Contact Tel: ${inquiry.phone}
${inquiry.company ? `Company: ${inquiry.company}\n` : ''}${inquiry.gst ? `GSTIN: ${inquiry.gst}\n` : ''}${inquiry.category ? `Category: ${inquiry.category}\n` : ''}${inquiry.requirement ? `Requirement: ${inquiry.requirement}\n` : ''}${inquiry.size ? `Size / Specification: ${inquiry.size}\n` : ''}${inquiry.quantity ? `Quantity: ${inquiry.quantity} ${inquiry.unit || 'MT'}\n` : ''}

Need urgent supply or stock verification?
Direct Hotline: +91 96015 74966
WhatsApp: https://wa.me/919601574966
Email: ${config.senderEmail || 'help@dahejsupport.com'}

DAHEJ SUPPORT · DAHEJ
Industrial Steel & Building Materials Supplier
G/F/02, Rushiraj Complex, Rahiyad Chokdi, Dahej Road, Dist. Bharuch, Gujarat - 392130`;

    const clientHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <style>
    * { box-sizing: border-box !important; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px 4px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 6px !important; }
      .header-pad { padding: 18px 14px !important; }
      .body-pad { padding: 18px 14px !important; }
      .footer-pad { padding: 14px 14px !important; }
      .btn-stack { display: block !important; width: 100% !important; margin: 4px 0 !important; }
      .btn-link { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #f8fafc; padding: 16px 8px; width: 100%;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Top Header Banner -->
          <tr>
            <td class="header-pad" style="background-color: #00286a; padding: 22px 24px; border-bottom: 4px solid #f59e0b;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="margin-bottom: 6px;">
                      <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        Inquiry Desk
                      </span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2;">DAHEJ SUPPORT</h1>
                    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 12px; font-weight: 500; line-height: 1.4;">Industrial Steel & Building Materials Supplier · Dahej, Gujarat</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="body-pad" style="padding: 24px 20px; background-color: #ffffff;">
              <h2 style="margin: 0 0 12px 0; font-size: 17px; color: #00286a; font-weight: 700;">
                Inquiry Confirmation & Received Notice
              </h2>
              
              <p style="margin: 0 0 14px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                Dear <strong>${inquiry.name}</strong>,
              </p>

              <p style="margin: 0 0 14px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                Thank you for reaching out to <strong>DAHEJ SUPPORT (Dahej)</strong>. We have successfully registered your sourcing inquiry and forwarded your requirements to our sales & estimation desk.
              </p>

              <!-- 24 Hours Contact Guarantee Banner -->
              <div style="background-color: #eff6ff; border-left: 4px solid #0284c7; padding: 12px 14px; border-radius: 0 6px 6px 0; margin: 16px 0;">
                <strong style="color: #0369a1; font-size: 13.5px; display: block; margin-bottom: 4px;">⏱️ Contact Guarantee within 24 Hours:</strong>
                <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                  Our sales coordinator will review live stock availability and connect with you on <strong>${inquiry.phone}</strong> within <strong>24 hours</strong> with current pricing and dispatch timelines.
                </p>
              </div>

              <!-- Sourcing Details Summary Card -->
              <div style="margin: 18px 0 12px 0;">
                <h3 style="margin: 0 0 8px 0; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">
                  Inquiry Submission Summary
                </h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="table-layout: fixed; width: 100%; font-size: 13px; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; word-break: break-word;">
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td width="38%" style="color: #64748b; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">Reference No:</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;"><code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #00286a;">#${inquiry.id}</code></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="color: #64748b; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">Contact Person:</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;"><strong>${inquiry.name}</strong></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="color: #64748b; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">Registered Phone:</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${inquiry.phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${inquiry.phone}</a></td>
                  </tr>
                  ${inquiry.company ? `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="color: #64748b; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">Company / Firm:</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;"><strong>${inquiry.company}</strong></td>
                  </tr>` : ''}
                  ${inquiry.gst ? `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="color: #64748b; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">GSTIN:</td>
                    <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;"><span style="font-family: monospace; font-weight: 700; color: #00286a; letter-spacing: 0.5px;">${inquiry.gst}</span></td>
                  </tr>` : ''}
                  <tr>
                    <td style="color: #64748b; font-weight: 600; padding: 6px 8px;">Submitted On:</td>
                    <td style="padding: 6px 8px;">${inquiry.timestamp || new Date().toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>

              <!-- Material Requirements -->
              <div style="margin: 16px 0 10px 0;">
                <h3 style="margin: 0 0 6px 0; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">
                  Material / Requirement Details
                </h3>
                ${requirementDetailsHtml}
              </div>

              <!-- Urgent Need Action Box -->
              <div style="background-color: #fefce8; border: 1.5px dashed #ca8a04; border-radius: 8px; padding: 14px 16px; margin: 20px 0 8px 0; text-align: center;">
                <div style="color: #854d0e; font-weight: 700; font-size: 13.5px; margin-bottom: 4px;">
                  ⚡ Need Urgent Dispatch Confirmation?
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #713f12; line-height: 1.4;">
                  Connect with our Dahej Yard Sales Hotline directly:
                </p>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="btn-stack" style="padding: 3px;" valign="middle">
                      <a href="tel:+919601574966" class="btn-link" style="display: block; text-align: center; background-color: #00286a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 6px; box-sizing: border-box;">
                        📞 Call +91 96015 74966
                      </a>
                    </td>
                    <td class="btn-stack" style="padding: 3px;" valign="middle">
                      <a href="https://wa.me/919601574966?text=Hello%20Dahej%20Support,%20I%20have%20submitted%20inquiry%20%23${inquiry.id}" class="btn-link" style="display: block; text-align: center; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 6px; box-sizing: border-box;">
                        💬 WhatsApp Desk
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="background-color: #f1f5f9; padding: 16px 20px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 11.5px; color: #64748b; line-height: 1.6; word-break: break-word;">
                    <strong style="color: #00286a; font-size: 12.5px;">DAHEJ SUPPORT · DAHEJ</strong><br>
                    <strong>Main Office:</strong> G/F/02, Rushiraj Complex, Rahiyad Chokdi, Dahej Road, Ta-Vagra, Dist. Bharuch, Gujarat - 392130<br>
                    <strong>Stockyard:</strong> D/2/E/331, Galenda Road, Near Suva Chokdi, GIDC Dahej, Gujarat - 392130<br>
                    <strong>Hotlines:</strong> +91 96015 74966 · <strong>Inquiry Desk:</strong> ${config.senderEmail || 'help@dahejsupport.com'}<br>
                    GSTIN: 24BCSPP4924R1ZN
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
</html>`;

    clientResult = await dispatchEmailWithConfig(
      {
        to: inquiry.email.trim(),
        subject,
        body: plainText,
        html: clientHtml
      },
      config
    );
  }

  // 2. DISPATCH INSTANT LEAD ALERT EMAIL TO ADMIN IF CONFIGURED (Responsive & Mobile-Proof)
  const adminTarget = (config.adminNotificationEmail || '').trim();
  if (adminTarget && adminTarget.includes('@')) {
    const cleanPhone = inquiry.phone ? inquiry.phone.replace(/[^0-9]/g, '') : '';
    const whatsappNum = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const adminSubject = `🚨 [NEW INQUIRY LEAD] #${inquiry.id} - ${inquiry.name} (${inquiry.company || 'Direct Buyer'})`;

    const adminHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${adminSubject}</title>
  <style>
    * { box-sizing: border-box !important; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 6px 2px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 6px !important; }
      .header-pad { padding: 14px 12px !important; }
      .body-pad { padding: 14px 10px !important; }
      .btn-stack { display: block !important; width: 100% !important; padding: 3px 0 !important; }
      .btn-link { display: block !important; width: 100% !important; text-align: center !important; }
      .table-label { width: 38% !important; font-size: 12px !important; padding: 6px 6px !important; }
      .table-value { font-size: 12.5px !important; padding: 6px 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #0f172a; -webkit-font-smoothing: antialiased;">
  <!-- Outer Wrapper -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-wrapper" style="background-color: #0f172a; padding: 12px 6px; width: 100%;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Card -->
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          
          <!-- Admin Header -->
          <tr>
            <td class="header-pad" style="background-color: #0f172a; padding: 16px 18px; border-bottom: 3px solid #0284c7;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="margin-bottom: 6px;">
                      <span style="display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
                        🚨 NEW INQUIRY LEAD
                      </span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; line-height: 1.3; word-break: break-word;">
                      Incoming Material Requirement
                    </h1>
                    <div style="color: #94a3b8; font-size: 11.5px; margin-top: 4px;">
                      🕒 ${inquiry.timestamp || new Date().toLocaleString('en-IN')}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="body-pad" style="padding: 18px 16px; background-color: #ffffff;">
              
              <!-- Lead Action Strip -->
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 12px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  ⚡ Quick Client Connect:
                </div>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="btn-stack" style="padding: 2px 3px 2px 0;" valign="middle">
                      <a href="tel:${inquiry.phone}" class="btn-link" style="display: block; text-align: center; background-color: #00286a; color: #ffffff; text-decoration: none; font-size: 12.5px; font-weight: 700; padding: 8px 10px; border-radius: 5px; box-sizing: border-box;">
                        📞 Call Client
                      </a>
                    </td>
                    ${whatsappNum ? `
                    <td class="btn-stack" style="padding: 2px 3px 2px 0;" valign="middle">
                      <a href="https://wa.me/${whatsappNum}?text=Hello%20${encodeURIComponent(inquiry.name)},%20thank%20you%20for%20your%20inquiry%20at%20Dahej%20Support." class="btn-link" style="display: block; text-align: center; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 12.5px; font-weight: 700; padding: 8px 10px; border-radius: 5px; box-sizing: border-box;">
                        💬 WhatsApp
                      </a>
                    </td>` : ''}
                    ${inquiry.email ? `
                    <td class="btn-stack" style="padding: 2px 0;" valign="middle">
                      <a href="mailto:${inquiry.email}" class="btn-link" style="display: block; text-align: center; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 12.5px; font-weight: 700; padding: 8px 10px; border-radius: 5px; box-sizing: border-box;">
                        ✉️ Email
                      </a>
                    </td>` : ''}
                  </tr>
                </table>
              </div>

              <!-- Customer Profile Table -->
              <h3 style="margin: 0 0 6px 0; font-size: 12.5px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">
                Customer Profile & Business Details
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed; width: 100%; font-size: 13px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px; word-break: break-word;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td width="36%" class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Customer:</td>
                  <td class="table-value" style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;"><strong style="color: #0f172a; font-size: 13.5px;">${inquiry.name}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Company:</td>
                  <td class="table-value" style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;"><strong>${inquiry.company || 'Not Specified'}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Phone:</td>
                  <td class="table-value" style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;"><strong style="color: #00286a;"><a href="tel:${inquiry.phone}" style="color: #00286a; text-decoration: none;">${inquiry.phone}</a></strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">Email:</td>
                  <td class="table-value" style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; overflow-wrap: anywhere;">${inquiry.email ? `<a href="mailto:${inquiry.email}" style="color: #0284c7; text-decoration: none;">${inquiry.email}</a>` : 'None'}</td>
                </tr>
                ${inquiry.gst ? `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">GSTIN:</td>
                  <td class="table-value" style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;"><span style="font-family: monospace; font-weight: 700; color: #b45309; letter-spacing: 0.5px;">${inquiry.gst}</span></td>
                </tr>` : ''}
                <tr>
                  <td class="table-label" style="color: #64748b; font-weight: 600; padding: 7px 10px;">Ref ID:</td>
                  <td class="table-value" style="padding: 7px 10px; overflow-wrap: anywhere;"><code style="background-color: #e2e8f0; padding: 2px 5px; border-radius: 4px; font-weight: 700; color: #00286a; font-size: 12px;">#${inquiry.id}</code> (${inquiry.type.toUpperCase()})</td>
                </tr>
              </table>

              <!-- Material Requirements -->
              <h3 style="margin: 0 0 6px 0; font-size: 12.5px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">
                Requirement Line Items
              </h3>
              ${requirementDetailsHtml}

              <div style="margin-top: 16px; padding: 10px; background-color: #f1f5f9; border-radius: 6px; font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.4;">
                This lead notification was automatically generated by DAHEJ SUPPORT Inquiry Dispatcher.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Dispatch admin alert asynchronously
    dispatchEmailWithConfig(
      {
        to: adminTarget,
        subject: adminSubject,
        body: `New Inquiry from ${inquiry.name} (${inquiry.phone}) - Ref #${inquiry.id}`,
        html: adminHtml
      },
      config
    ).catch(adminErr => console.warn('Admin lead alert dispatch error:', adminErr));
  }

  return clientResult;
}
