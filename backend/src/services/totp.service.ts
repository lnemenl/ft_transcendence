// - TOTP class: https://hectorm.github.io/otpauth/classes/TOTP.html
// - https://dev.to/wesleyisr4/how-to-create-two-factor-authentication-2fa-and-best-practices-4mjl

import { TOTP } from 'otpauth';
import QRCode from 'qrcode';

// Configuration for our TOTP implementation using otpauth
// window (drift tolerance) is NOT a constructor option in otpauth; it's passed to validate({ token, window })
// issuer is displayed in authenticator app and embedded in the otpauth URL produced by totp.toString()
const TOTP_CONFIG = {
  algorithm: 'SHA1' as const, // RFC 6238 default HMAC algorithm
  digits: 6, // RFC 6238 default number of digits
  issuer: 'ft_transcendence', // Shown in authenticator app; appears in otpauth URL
  period: 30, // RFC 6238 default period: 30 seconds
  window: 0, // No time-step drift tolerance; must match current 30-second window exactly
} as const;

export const generateSecret = () => {
  const totp = new TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: 'temp',
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });
  return totp.secret.base32;
};

export const generateQRCode = (username: string, secret: string) => {
  const totp = new TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: username,
    secret,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });
  // getting the otpauth URI
  const otpauthUrl = totp.toString();
  return QRCode.toDataURL(otpauthUrl);
};

export const verify = (secret: string, token: string) => {
  // The try catch block here is for treat bad input as invalid token rather than server error
  try {
    const totp = new TOTP({
      secret,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
    });
    const delta = totp.validate({ token, window: TOTP_CONFIG.window });
    return delta !== null;
  } catch (_err) {
    return false;
  }
};

// Produces the current 6-digit code for the given secret
export const generate = (secret: string) => {
  const totp = new TOTP({
    secret,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });
  return totp.generate();
};

// Builds the otpauth:// TOTP URI that authenticator apps understand
// and basically binds the secret to a username for display/QR generation
export const getOTPAuthUrl = (username: string, secret: string) => {
  const totp = new TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: username,
    secret,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });
  return totp.toString();
};
