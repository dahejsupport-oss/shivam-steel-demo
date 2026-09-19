import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound, 
  ArrowLeft, 
  Send, 
  Info,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import { 
  verifyAdminCredentials,
  verifySecurityOtp,
  fetchAdminCredentialsFromCloud, 
  DEFAULT_ADMIN_CREDENTIALS,
  DEMO_ADMIN_CREDENTIALS,
  UNIVERSAL_DEMO_OTP,
  isRecognizedAdminEmailAsync,
  sendAdminSecurityOtpEmail,
  saveAdminCredentials,
  getAdminCredentials
} from '../utils/adminAuthService';
import type { SecurityOtpSession } from '../utils/adminAuthService';
import { 
  fetchEmailConfigFromCloud, 
  fetchInquiryEmailConfigFromCloud 
} from '../utils/emailService';
import MainSiteBanner from '../components/MainSiteBanner';
import './Login.css';

type LoginMode = 'login_credentials' | 'login_otp' | 'forgot_request' | 'forgot_verify';

export default function Login() {
  const navigate = useNavigate();
  
  // View mode: Mandatory 2-step OTP flow
  const [mode, setMode] = useState<LoginMode>('login_credentials');

  // Step 1: Login Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);

  // Auto-fill demo credentials
  const handleAutoFillCredentials = () => {
    setEmail(DEMO_ADMIN_CREDENTIALS.email);
    setPassword(DEMO_ADMIN_CREDENTIALS.password);
    setError('');
    setAutoFillSuccess(true);
    setTimeout(() => setAutoFillSuccess(false), 3000);
  };

  // Instant 1-click login for demo evaluation
  const handleInstantDirectLogin = () => {
    localStorage.setItem('isAdminLoggedIn', 'true');
    localStorage.setItem('shivam_admin_auth', 'true');
    navigate('/admin');
  };

  // Auto-fill demo OTP (123456)
  const handleAutoFillOtp = () => {
    setLoginOtp(UNIVERSAL_DEMO_OTP);
    setError('');
  };

  // Step 2: Mandatory Login OTP state
  const [loginOtp, setLoginOtp] = useState('');
  const [verifiedTargetEmail, setVerifiedTargetEmail] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpNotice, setOtpNotice] = useState<{ type: 'info' | 'success' | 'error'; message: string; otpHint?: string } | null>(null);

  // Forgot Password flow state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string; otpHint?: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // If already authenticated, redirect to admin & preload cloud credentials & cloud email configs
  useEffect(() => {
    Promise.all([
      fetchAdminCredentialsFromCloud().catch(() => null),
      fetchEmailConfigFromCloud().catch(() => null),
      fetchInquiryEmailConfigFromCloud().catch(() => null)
    ]);
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true' || localStorage.getItem('shivam_admin_auth') === 'true';
    if (isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  // Switch to Forgot Password mode
  const handleOpenForgotPassword = () => {
    setMode('forgot_request');
    setForgotEmail(email.trim());
    setForgotMsg(null);
    setError('');
  };

  // Switch back to Login Step 1 mode
  const handleBackToLogin = () => {
    setMode('login_credentials');
    setForgotMsg(null);
    setOtpNotice(null);
    setLoginOtp('');
    setError('');
  };

  // ----------------------------------------------------------------
  // STEP 1: VERIFY CREDENTIALS & INSTANTLY PROCEED TO OTP (DEMO MODE)
  // ----------------------------------------------------------------
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpNotice(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your admin email address or username.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your admin password.');
      return;
    }

    // Instant local verification
    const isValid = verifyAdminCredentials(cleanEmail, cleanPassword);

    if (!isValid) {
      setError('Invalid admin email or password. Please use demo credentials: login@dahejsupport.com / admin123');
      return;
    }

    // Determine the target email address
    let targetRecipient = cleanEmail.toLowerCase();
    if (targetRecipient === 'admin' || !targetRecipient.includes('@')) {
      targetRecipient = getAdminCredentials().email.toLowerCase() || DEFAULT_ADMIN_CREDENTIALS.email;
    }

    setVerifiedTargetEmail(targetRecipient);

    // Save active OTP session locally with Universal Demo Code
    const otpSessionData: SecurityOtpSession = {
      code: UNIVERSAL_DEMO_OTP,
      targetEmail: targetRecipient,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    localStorage.setItem('shivam_steel_admin_otp_session', JSON.stringify(otpSessionData));

    // Direct instant transition to next OTP step with zero delay
    setMode('login_otp');
    setOtpNotice({
      type: 'info',
      message: `Demo Mode Active: Enter Demo OTP 123456 to continue. (On live site, a real OTP is sent to ${targetRecipient}).`,
      otpHint: UNIVERSAL_DEMO_OTP
    });
  };

  // ----------------------------------------------------------------
  // STEP 2: VERIFY 6-DIGIT COMPULSORY LOGIN OTP (INSTANT)
  // ----------------------------------------------------------------
  const handleVerifyLoginOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = loginOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit security code (Demo OTP: 123456).');
      return;
    }

    setIsOtpLoading(true);

    const verification = verifySecurityOtp(cleanOtp, verifiedTargetEmail);
    if (!verification.valid) {
      setIsOtpLoading(false);
      setError(verification.message || 'Incorrect security code. Please enter Demo OTP: 123456.');
      return;
    }

    // Two-factor authentication successfully cleared!
    setIsOtpLoading(false);
    setOtpSuccess(true);
    localStorage.setItem('isAdminLoggedIn', 'true');
    localStorage.setItem('shivam_admin_auth', 'true');

    setTimeout(() => {
      navigate('/admin');
    }, 400);
  };

  // Resend Login OTP (Instant Demo Code Reminder)
  const handleResendLoginOtp = () => {
    if (!verifiedTargetEmail) return;
    setOtpNotice({
      type: 'info',
      message: `Demo Mode: Security OTP is 123456 (No real email is sent in Demo).`,
      otpHint: UNIVERSAL_DEMO_OTP
    });
  };

  // ----------------------------------------------------------------
  // FORGOT PASSWORD: STEP 1 (REQUEST RESET OTP)
  // ----------------------------------------------------------------
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    let cleanTarget = forgotEmail.trim().toLowerCase();
    if (cleanTarget === 'admin') {
      const cloudCreds = await fetchAdminCredentialsFromCloud();
      cleanTarget = cloudCreds.email?.toLowerCase() || getAdminCredentials().email.toLowerCase() || DEFAULT_ADMIN_CREDENTIALS.email;
    }

    if (!cleanTarget || !cleanTarget.includes('@')) {
      setForgotMsg({ type: 'error', message: 'Please enter a valid registered administrator email address.' });
      return;
    }

    setIsForgotLoading(true);

    try {
      await fetchEmailConfigFromCloud().catch(() => null);
      const isRecognized = await isRecognizedAdminEmailAsync(cleanTarget);
      if (!isRecognized) {
        setIsForgotLoading(false);
        setForgotMsg({ 
          type: 'error', 
          message: `The email "${cleanTarget}" is not recognized as an administrator account.` 
        });
        return;
      }

      const result = await sendAdminSecurityOtpEmail(cleanTarget, undefined, true, 'password_reset');
      setIsForgotLoading(false);

      if (result.success) {
        setMode('forgot_verify');
        if (result.emailSent) {
          setForgotMsg({
            type: 'info',
            message: `A 6-digit password reset code has been dispatched to ${cleanTarget}. Please check your inbox and spam folder.`
          });
        } else {
          setForgotMsg({
            type: 'info',
            message: `Password reset code generated for ${cleanTarget}.`,
            otpHint: result.otpCode
          });
        }
      } else {
        setForgotMsg({ type: 'error', message: result.message || 'Failed to dispatch verification code.' });
      }
    } catch (err: any) {
      setIsForgotLoading(false);
      setForgotMsg({ type: 'error', message: err.message || 'Error requesting reset code.' });
    }
  };

  // ----------------------------------------------------------------
  // FORGOT PASSWORD: STEP 2 (VERIFY OTP & SAVE NEW PASSWORD)
  // ----------------------------------------------------------------
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    let cleanTarget = forgotEmail.trim().toLowerCase();
    if (cleanTarget === 'admin') {
      cleanTarget = DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase();
    }
    const cleanOtp = forgotOtp.trim();
    const cleanNewPass = newPassword.trim();
    const cleanConfirmPass = confirmPassword.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotMsg({ type: 'error', message: 'Please enter the valid 6-digit security code sent to your email.' });
      return;
    }

    if (cleanNewPass.length < 5) {
      setForgotMsg({ type: 'error', message: 'New password must be at least 5 characters long.' });
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setForgotMsg({ type: 'error', message: 'New password and confirmation password do not match.' });
      return;
    }

    setIsForgotLoading(true);

    // Verify entered OTP
    const verification = verifySecurityOtp(cleanOtp, cleanTarget);
    if (!verification.valid) {
      setIsForgotLoading(false);
      setForgotMsg({ type: 'error', message: verification.message });
      return;
    }

    try {
      // Save updated password in localStorage and sync to Supabase cloud
      saveAdminCredentials({
        email: cleanTarget,
        password: cleanNewPass
      });

      setIsForgotLoading(false);
      setForgotMsg({
        type: 'success',
        message: 'Password reset successfully! Initializing session and accessing Admin Dashboard...'
      });

      // Automatically log the admin in
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('shivam_admin_auth', 'true');

      setTimeout(() => {
        navigate('/admin');
      }, 1200);
    } catch (err: any) {
      setIsForgotLoading(false);
      setForgotMsg({ type: 'error', message: 'Error updating password. Please try again.' });
    }
  };

  return (
    <div className="login-page animate-fade-in">
      {/* Top Banner right at top of screen */}
      <MainSiteBanner variant="standalone" />

      <div className="login-bg-overlay"></div>

      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-card-header">
            <Link to="/" className="login-logo-link" title="Return to Dahej Support Home">
              <img 
                src="/logo/logo-icon.png" 
                alt="Dahej Support" 
                className="login-brand-logo-icon"
              />
            </Link>
            <div className="login-tag">
              <ShieldCheck size={14} style={{ marginRight: '5px', color: '#16a34a' }} />
              2-Step Protected Gateway
            </div>
            
            {mode === 'login_credentials' && (
              <>
                <h2>Admin Portal Login</h2>
                <div className="login-desc-bilingual">
                  <p className="login-desc-en">
                    <strong>Note:</strong> This is a <strong>Demo Website</strong>. On the real/live site, you will need to enter your Mail, Password, and verify with an OTP.
                  </p>
                  <p className="login-desc-hi">
                    <strong>नोट:</strong> यह एक <strong>डेमो वेबसाइट</strong> है। रियल (असली) साइट पर आपको अपना ईमेल (Mail), पासवर्ड (Password) और OTP डालना पड़ेगा।
                  </p>
                </div>
              </>
            )}

            {mode === 'login_otp' && (
              <>
                <h2>Two-Factor Verification</h2>
                <p>Enter the 6-digit security code sent to <strong>{verifiedTargetEmail}</strong> to complete your login.</p>
              </>
            )}

            {mode === 'forgot_request' && (
              <>
                <h2>Reset Admin Password</h2>
                <p>Enter your registered administrator email to receive a secure 6-digit verification code (OTP).</p>
              </>
            )}

            {mode === 'forgot_verify' && (
              <>
                <h2>Set New Password</h2>
                <p>Enter the 6-digit verification code sent to <strong>{forgotEmail}</strong> and choose your new password.</p>
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* 1. MANDATORY LOGIN STEP 1: CREDENTIALS                   */}
          {/* ======================================================== */}
          {mode === 'login_credentials' && (
            <>
              {/* DEMO CREDENTIALS BOX */}
              <div className="demo-credentials-card animate-fade-in">
                <div className="demo-card-top">
                  <div className="demo-pill">
                    <Sparkles size={13} className="demo-sparkle" />
                    <span>DEMO ACCESS CREDENTIALS</span>
                  </div>
                  <span className="demo-live-badge">Ready to Test</span>
                </div>

                <div className="demo-credentials-list">
                  <div className="demo-credential-item">
                    <span className="demo-cred-key">Email:</span>
                    <code className="demo-cred-val">{DEMO_ADMIN_CREDENTIALS.email}</code>
                  </div>
                  <div className="demo-credential-item">
                    <span className="demo-cred-key">Password:</span>
                    <code className="demo-cred-val">{DEMO_ADMIN_CREDENTIALS.password}</code>
                  </div>
                  <div className="demo-credential-item">
                    <span className="demo-cred-key">Demo OTP:</span>
                    <code className="demo-cred-val demo-otp-highlight">{UNIVERSAL_DEMO_OTP}</code>
                  </div>
                </div>

                <div className="demo-actions-grid">
                  <button
                    type="button"
                    onClick={handleAutoFillCredentials}
                    className="btn-demo-autofill"
                    title="Click to instantly fill Email and Password into the login form below"
                  >
                    {autoFillSuccess ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span>Credentials Filled!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Auto-Fill Credentials</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantDirectLogin}
                    className="btn-demo-instant"
                    title="Directly enter Admin Portal without filling anything"
                  >
                    <ShieldCheck size={14} />
                    <span>⚡ 1-Click Direct Login</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error-card animate-fade-in">
                  <ShieldAlert size={18} className="error-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="login-form">
                {/* Email / Username Field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Admin Email / Username *</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="login-email" 
                      required
                      autoComplete="username"
                      disabled={isLoading}
                      className="form-control login-input" 
                      placeholder="Enter admin email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-password-toggle-btn"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="login-password" 
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="form-control login-input" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Forgot Password Link Row */}
                <div className="login-options-row">
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="forgot-password-link-btn"
                  >
                    <KeyRound size={13} />
                    <span>Forgot Password?</span>
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>Verifying Credentials & Sending OTP...</span>
                  ) : (
                    <>
                      <span>Continue to Security OTP</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ======================================================== */}
          {/* 2. MANDATORY LOGIN STEP 2: VERIFY 6-DIGIT OTP            */}
          {/* ======================================================== */}
          {mode === 'login_otp' && (
            <div className="animate-fade-in">
              {/* DEMO OTP QUICK FILL BOX */}
              <div className="demo-otp-banner animate-fade-in">
                <div className="demo-otp-banner-left">
                  <Sparkles size={16} className="demo-sparkle" />
                  <div>
                    <div className="demo-otp-banner-title">Demo Universal OTP: <strong>{UNIVERSAL_DEMO_OTP}</strong></div>
                    <div className="demo-otp-banner-sub">No email access needed. Use 123456 to instantly pass verification.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="btn-demo-fill-otp"
                >
                  Auto-Fill 123456
                </button>
              </div>

              {error && (
                <div className="login-error-card animate-fade-in">
                  <ShieldAlert size={18} className="error-icon" />
                  <span>{error}</span>
                </div>
              )}

              {otpNotice && (
                <div className={`login-${otpNotice.type}-card animate-fade-in`}>
                  {otpNotice.type === 'error' && <ShieldAlert size={18} className="error-icon" />}
                  {otpNotice.type === 'success' && <CheckCircle2 size={18} className="success-icon" />}
                  {otpNotice.type === 'info' && <Info size={18} className="info-icon" style={{ color: '#0284c7' }} />}
                  <div>
                    <div>{otpNotice.message}</div>
                    {otpNotice.otpHint && (
                      <div style={{ marginTop: '4px', fontWeight: 700, color: '#00286a' }}>
                        OTP Preview: <code>{otpNotice.otpHint}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {otpSuccess && (
                <div className="login-success-card animate-fade-in">
                  <CheckCircle2 size={18} className="success-icon" />
                  <span>OTP verified successfully! Accessing Admin Control Room...</span>
                </div>
              )}

              <form onSubmit={handleVerifyLoginOtpSubmit} className="login-form">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="login-otp-code" style={{ margin: 0 }}>6-Digit Security OTP *</label>
                    <button
                      type="button"
                      onClick={handleResendLoginOtp}
                      disabled={isOtpLoading || otpSuccess}
                      className="resend-otp-btn"
                    >
                      <RefreshCw size={12} className={isOtpLoading ? 'animate-spin' : ''} />
                      <span>Resend OTP</span>
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="login-otp-code" 
                      required
                      maxLength={6}
                      autoFocus
                      disabled={isOtpLoading || otpSuccess}
                      className="form-control login-input otp-code-input" 
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
                    <span>Demo Mode: Enter <strong>123456</strong> or click Auto-Fill above.</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary login-submit-btn"
                  disabled={isOtpLoading || otpSuccess}
                >
                  {isOtpLoading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Verify OTP & Access Portal</span>
                    </>
                  )}
                </button>

                <div className="forgot-nav-row">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={isOtpLoading || otpSuccess}
                    className="btn-back-to-login"
                  >
                    <ArrowLeft size={14} /> Back / Use Different Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. FORGOT PASSWORD - STEP 1: REQUEST RESET OTP           */}
          {/* ======================================================== */}
          {mode === 'forgot_request' && (
            <div className="animate-fade-in">
              {forgotMsg && (
                <div className={`login-${forgotMsg.type}-card animate-fade-in`}>
                  {forgotMsg.type === 'error' && <ShieldAlert size={18} className="error-icon" />}
                  {forgotMsg.type === 'success' && <CheckCircle2 size={18} className="success-icon" />}
                  {forgotMsg.type === 'info' && <Info size={18} className="info-icon" style={{ color: '#0284c7' }} />}
                  <span>{forgotMsg.message}</span>
                </div>
              )}

              <form onSubmit={handleRequestResetOtp} className="login-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">Registered Admin Email *</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      id="forgot-email" 
                      required
                      autoComplete="email"
                      disabled={isForgotLoading}
                      className="form-control login-input" 
                      placeholder="Enter registered administrator email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
                    <span>A 6-digit password reset OTP will be dispatched to this email.</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary login-submit-btn"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? (
                    <span>Sending Verification Code...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Verification Code (OTP)</span>
                    </>
                  )}
                </button>

                <div className="forgot-nav-row">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="btn-back-to-login"
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. FORGOT PASSWORD - STEP 2: VERIFY OTP & SET PASSWORD   */}
          {/* ======================================================== */}
          {mode === 'forgot_verify' && (
            <div className="animate-fade-in">
              {forgotMsg && (
                <div className={`login-${forgotMsg.type === 'info' ? 'info' : forgotMsg.type}-card animate-fade-in`}>
                  {forgotMsg.type === 'error' && <ShieldAlert size={18} className="error-icon" />}
                  {forgotMsg.type === 'success' && <CheckCircle2 size={18} className="success-icon" />}
                  {forgotMsg.type === 'info' && <Info size={18} className="info-icon" style={{ color: '#0284c7' }} />}
                  <div>
                    <div>{forgotMsg.message}</div>
                    {forgotMsg.otpHint && (
                      <div style={{ marginTop: '4px', fontWeight: 700, color: '#00286a' }}>
                        OTP Code Preview: <code>{forgotMsg.otpHint}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="login-form">
                {/* 6-digit OTP Code */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="reset-otp" style={{ margin: 0 }}>6-Digit Security OTP *</label>
                    <button
                      type="button"
                      onClick={handleRequestResetOtp}
                      disabled={isForgotLoading}
                      className="resend-otp-btn"
                    >
                      <RefreshCw size={12} className={isForgotLoading ? 'animate-spin' : ''} />
                      <span>Resend Code</span>
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="reset-otp" 
                      required
                      maxLength={6}
                      autoFocus
                      disabled={isForgotLoading}
                      className="form-control login-input otp-code-input" 
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="reset-new-password" style={{ margin: 0 }}>New Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="login-password-toggle-btn"
                      title={showNewPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      id="reset-new-password" 
                      required
                      disabled={isForgotLoading}
                      className="form-control login-input" 
                      placeholder="Minimum 5 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password *</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      id="reset-confirm-password" 
                      required
                      disabled={isForgotLoading}
                      className="form-control login-input" 
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary login-submit-btn"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? (
                    <span>Updating Password...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Save New Password & Access Portal</span>
                    </>
                  )}
                </button>

                <div className="forgot-nav-row">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="btn-back-to-login"
                  >
                    <ArrowLeft size={14} /> Cancel & Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="login-card-footer">
            <a 
              href="https://www.dahejsupport.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="back-to-site-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#00286a' }}
            >
              <span>Back to Dahej Support Site (www.dahejsupport.com)</span>
              <ArrowRight size={14} />
            </a>
            <div style={{ marginTop: '8px' }}>
              <Link to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                &larr; Return to Shivam Steel Demo Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
