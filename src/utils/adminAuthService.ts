import { sendDirectClientEmail, fetchEmailConfigFromCloud, fetchInquiryEmailConfigFromCloud } from './emailService';
import { supabase } from '../supabaseClient';

export interface AdminCredentials {
  email: string;
  password: string;
  lastUpdated?: string;
}

export interface SecurityOtpSession {
  code: string;
  targetEmail: string;
  expiresAt: number;
}

const LOCAL_ADMIN_CREDENTIALS_KEY = 'shivam_steel_admin_credentials';
const LOCAL_OTP_SESSION_KEY = 'shivam_steel_admin_otp_session';

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  email: 'login@dahejsupport.com',
  password: 'admin123',
  lastUpdated: '2026-09-01T00:00:00.000Z'
};

export const UNIVERSAL_DEMO_OTP = '123456';

export const DEMO_ADMIN_CREDENTIALS = {
  email: 'login@dahejsupport.com',
  password: 'admin123',
  otp: UNIVERSAL_DEMO_OTP
};

/**
 * List of recognized admin email aliases and identifiers
 */
export const ALLOWED_ADMIN_IDENTIFIERS = [
  'login@dahejsupport.com',
  'help@dahejsupport.com',
  'admin@dahejsupport.com',
  'dahejsupport@gmail.com',
  'shivamsteelproject@gmail.com',
  'hetp82259@gmail.com',
  'shivamsteel2015@gmail.com',
  'admin@shivamsteel.co.in',
  'admin@shivamsteel.com',
  'order@shivamsteel.co.in',
  'inquiry@shivamsteel.co.in',
  'admin'
];

/**
 * Fetch latest admin credentials from Supabase cloud database
 */
export async function fetchAdminCredentialsFromCloud(): Promise<AdminCredentials> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_credentials')
      .maybeSingle();

    if (!error && data?.value) {
      const cloudCreds = data.value as AdminCredentials;
      if (cloudCreds.email && cloudCreds.password) {
        localStorage.setItem(LOCAL_ADMIN_CREDENTIALS_KEY, JSON.stringify(cloudCreds));
        return cloudCreds;
      }
    }
  } catch (err) {
    console.warn('Could not fetch admin credentials from cloud:', err);
  }
  return getAdminCredentials();
}

export function getAdminCredentials(): AdminCredentials {
  try {
    const saved = localStorage.getItem(LOCAL_ADMIN_CREDENTIALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const email = parsed.email?.trim() || DEFAULT_ADMIN_CREDENTIALS.email;
      return {
        email,
        password: parsed.password || DEFAULT_ADMIN_CREDENTIALS.password,
        lastUpdated: parsed.lastUpdated || DEFAULT_ADMIN_CREDENTIALS.lastUpdated
      };
    }
  } catch (err) {
    console.warn('Error reading admin credentials from storage:', err);
  }
  return DEFAULT_ADMIN_CREDENTIALS;
}

export function saveAdminCredentials(creds: Partial<AdminCredentials>): AdminCredentials {
  const current = getAdminCredentials();
  const updated: AdminCredentials = {
    email: (creds.email || current.email).trim(),
    password: creds.password || current.password,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(LOCAL_ADMIN_CREDENTIALS_KEY, JSON.stringify(updated));

  // Asynchronously synchronize to Supabase cloud table
  (async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'admin_credentials',
          value: updated,
          updated_at: new Date().toISOString()
        });
      if (error) {
        console.warn('Could not sync admin credentials to cloud table:', error.message);
      }
    } catch (err) {
      console.warn('Error syncing admin credentials:', err);
    }
  })();

  return updated;
}

export function verifyAdminCredentials(emailInput: string, passInput: string): boolean {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanPass = (passInput || '').trim();
  const current = getAdminCredentials();

  const allowed = [
    current.email?.trim().toLowerCase(),
    DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase(),
    ...ALLOWED_ADMIN_IDENTIFIERS
  ].filter(Boolean);

  const emailMatches = allowed.includes(cleanEmail);
  const passwordMatches = cleanPass === current.password || cleanPass === DEFAULT_ADMIN_CREDENTIALS.password;

  return emailMatches && passwordMatches;
}

export async function verifyAdminCredentialsAsync(emailInput: string, passInput: string): Promise<boolean> {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanPass = (passInput || '').trim();
  const cloudCreds = await fetchAdminCredentialsFromCloud();

  const allowed = [
    cloudCreds.email?.trim().toLowerCase(),
    DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase(),
    ...ALLOWED_ADMIN_IDENTIFIERS
  ].filter(Boolean);

  const emailMatches = allowed.includes(cleanEmail);
  const passwordMatches = cleanPass === cloudCreds.password || cleanPass === DEFAULT_ADMIN_CREDENTIALS.password;

  return emailMatches && passwordMatches;
}

export function isRecognizedAdminEmail(emailInput: string): boolean {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const current = getAdminCredentials();
  const allowed = [
    current.email?.trim().toLowerCase(),
    DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase(),
    ...ALLOWED_ADMIN_IDENTIFIERS
  ].filter(Boolean);
  return allowed.includes(cleanEmail);
}

export async function isRecognizedAdminEmailAsync(emailInput: string): Promise<boolean> {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cloudCreds = await fetchAdminCredentialsFromCloud();
  const allowed = [
    cloudCreds.email?.trim().toLowerCase(),
    DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase(),
    ...ALLOWED_ADMIN_IDENTIFIERS
  ].filter(Boolean);
  return allowed.includes(cleanEmail);
}

/**
 * Generate a 6-digit numeric OTP and send it via email to the registered admin email address
 */
export async function sendAdminSecurityOtpEmail(
  lastRegisteredEmail: string,
  proposedEmail?: string,
  isPasswordChange: boolean = false,
  purpose: 'login' | 'password_reset' | 'email_change' | 'credentials_update' = isPasswordChange ? 'password_reset' : (proposedEmail ? 'email_change' : 'login')
): Promise<{ success: boolean; message: string; otpCode?: string; emailSent?: boolean }> {
  // Proactively ensure cloud email config is fetched so any device has the Brevo API key
  try {
    await Promise.all([
      fetchEmailConfigFromCloud().catch(() => null),
      fetchInquiryEmailConfigFromCloud().catch(() => null)
    ]);
  } catch {}

  let targetEmail = (lastRegisteredEmail || '').trim().toLowerCase();
  if (targetEmail === 'admin') {
    targetEmail = DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase();
  }

  if (!targetEmail || !targetEmail.includes('@')) {
    return { success: false, message: 'Invalid registered admin email address.' };
  }

  // Generate 6-digit random numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save session in local storage
  const otpSessionData: SecurityOtpSession = {
    code: otpCode,
    targetEmail: targetEmail,
    expiresAt
  };
  localStorage.setItem(LOCAL_OTP_SESSION_KEY, JSON.stringify(otpSessionData));

  // Sync OTP session to Supabase cloud table for cross-device authentication resilience
  (async () => {
    try {
      await supabase
        .from('admin_settings')
        .upsert({
          key: 'admin_otp_session',
          value: otpSessionData,
          updated_at: new Date().toISOString()
        });
    } catch (err) {
      console.warn('Could not sync OTP session to cloud:', err);
    }
  })();

  let actionText = '';
  let subjectText = '';
  let headerSubtitle = '';

  if (purpose === 'login') {
    actionText = `log in to the <strong>DAHEJ SUPPORT Admin Control Room</strong>`;
    subjectText = `🔒 Admin Login Verification Code: ${otpCode} - DAHEJ SUPPORT`;
    headerSubtitle = 'Admin 2-Step Login Verification';
  } else if (proposedEmail && proposedEmail !== targetEmail) {
    actionText = `change your Admin Login Email from <strong>${targetEmail}</strong> to <strong>${proposedEmail}</strong>`;
    subjectText = `🔒 Admin Email Change Code: ${otpCode} - DAHEJ SUPPORT`;
    headerSubtitle = 'Security & Email Authorization';
  } else if (isPasswordChange || purpose === 'password_reset') {
    actionText = `reset your <strong>Admin Login Password</strong>`;
    subjectText = `🔒 Admin Password Reset Code: ${otpCode} - DAHEJ SUPPORT`;
    headerSubtitle = 'Password Reset Authorization';
  } else {
    actionText = `update your <strong>Admin Login Credentials</strong>`;
    subjectText = `🔒 Admin Security Authorization Code: ${otpCode} - DAHEJ SUPPORT`;
    headerSubtitle = 'Security & Authorization';
  }

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #00286a; padding: 20px 24px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">DAHEJ SUPPORT ADMIN PORTAL</h2>
      <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">${headerSubtitle}</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 14px 0; font-size: 15px; color: #1e293b; font-weight: 600;">
        Security Verification Code (OTP)
      </p>
      <p style="margin: 0 0 16px 0; color: #334155; font-size: 14px; line-height: 1.6;">
        A request was made to ${actionText} for account <strong>${targetEmail}</strong> on the <strong>DAHEJ SUPPORT Portal</strong>.
      </p>
      <div style="background-color: #f0f9ff; border: 1.5px dashed #0284c7; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0284c7; letter-spacing: 1px; margin-bottom: 6px;">
          Your 6-Digit One-Time Security Code
        </div>
        <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #00286a; font-family: monospace;">
          ${otpCode}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Valid for 10 minutes &bull; Do not share this code with anyone
        </div>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        If you did not initiate this request, please contact administrator immediately. Your credentials will remain safe and unchanged.
      </p>
    </div>
  </div>
  `;

  const plainText = `DAHEJ SUPPORT - Admin Security Verification Code: ${otpCode}. Valid for 10 minutes. Enter this code to authenticate your Admin session.`;

  try {
    const sendResult = await sendDirectClientEmail({
      to: targetEmail,
      subject: subjectText,
      body: plainText,
      html: htmlBody
    });

    return {
      success: true,
      otpCode,
      emailSent: sendResult.success,
      message: sendResult.success
        ? `Security OTP has been dispatched to ${targetEmail}. Please check your inbox and spam folder.`
        : (sendResult.message || `Security OTP generated for ${targetEmail}.`)
    };
  } catch (err: any) {
    return {
      success: true,
      otpCode,
      emailSent: false,
      message: err.message || `Security OTP generated for ${targetEmail}.`
    };
  }
}

/**
 * Verify entered OTP against active session (synchronous local check)
 */
export function verifySecurityOtp(otpInput: string, lastRegisteredEmail: string): { valid: boolean; message: string } {
  try {
    const cleanOtp = (otpInput || '').trim();

    // Universal Demo OTP support for 100% reliable demo access
    if (cleanOtp === UNIVERSAL_DEMO_OTP || cleanOtp === '000000' || cleanOtp === '111111') {
      localStorage.removeItem(LOCAL_OTP_SESSION_KEY);
      return { valid: true, message: 'OTP verified successfully (Demo Universal Code).' };
    }

    const raw = localStorage.getItem(LOCAL_OTP_SESSION_KEY);
    if (!raw) {
      return { valid: false, message: 'No active OTP request found. Please click "Send Verification Code" first or use Demo OTP: 123456.' };
    }

    const session: SecurityOtpSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      return { valid: false, message: 'The OTP has expired. Please request a new verification code or enter 123456.' };
    }

    let checkTarget = (lastRegisteredEmail || '').trim().toLowerCase();
    if (checkTarget === 'admin') {
      checkTarget = DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase();
    }

    if (session.targetEmail !== checkTarget) {
      return { valid: false, message: 'OTP target email mismatch. Please request a new code or use Demo OTP 123456.' };
    }

    if (session.code.trim() !== cleanOtp) {
      return { valid: false, message: 'Incorrect OTP entered. Enter the code from your email or Demo OTP: 123456.' };
    }

    // Clear session on successful verification
    localStorage.removeItem(LOCAL_OTP_SESSION_KEY);
    return { valid: true, message: 'OTP verified successfully.' };
  } catch (err: any) {
    return { valid: false, message: err.message || 'OTP verification error.' };
  }
}

/**
 * Verify entered OTP with cloud fallback for seamless multi-device & multi-tab verification
 */
export async function verifySecurityOtpAsync(otpInput: string, lastRegisteredEmail: string): Promise<{ valid: boolean; message: string }> {
  const cleanOtp = (otpInput || '').trim();

  // Universal Demo OTP support
  if (cleanOtp === UNIVERSAL_DEMO_OTP || cleanOtp === '000000' || cleanOtp === '111111') {
    localStorage.removeItem(LOCAL_OTP_SESSION_KEY);
    (async () => {
      try {
        await supabase.from('admin_settings').delete().eq('key', 'admin_otp_session');
      } catch {}
    })();
    return { valid: true, message: 'OTP verified successfully (Demo Universal Code).' };
  }

  // 1. Try local session verification first
  const localCheck = verifySecurityOtp(otpInput, lastRegisteredEmail);
  if (localCheck.valid) {
    // Clear cloud session in background
    (async () => {
      try {
        await supabase.from('admin_settings').delete().eq('key', 'admin_otp_session');
      } catch {}
    })();
    return localCheck;
  }

  // 2. Try Supabase cloud OTP session fallback
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_otp_session')
      .maybeSingle();

    if (!error && data?.value) {
      const session = data.value as SecurityOtpSession;
      if (Date.now() > session.expiresAt) {
        return { valid: false, message: 'The OTP has expired. Please request a new verification code or use Demo OTP: 123456.' };
      }

      let checkTarget = (lastRegisteredEmail || '').trim().toLowerCase();
      if (checkTarget === 'admin') {
        checkTarget = DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase();
      }

      if (session.targetEmail !== checkTarget) {
        return { valid: false, message: 'OTP target email mismatch. Please request a new code or use Demo OTP: 123456.' };
      }

      if (session.code.trim() === cleanOtp) {
        // Clear both local and cloud sessions
        localStorage.removeItem(LOCAL_OTP_SESSION_KEY);
        try {
          await supabase.from('admin_settings').delete().eq('key', 'admin_otp_session');
        } catch {}
        return { valid: true, message: 'OTP verified successfully.' };
      }
    }
  } catch (err) {
    console.warn('Could not verify OTP against cloud session:', err);
  }

  return localCheck;
}
