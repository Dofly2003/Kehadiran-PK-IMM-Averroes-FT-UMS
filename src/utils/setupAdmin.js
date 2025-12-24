// src/utils/setupAdmin.js
import * as OTPAuth from "otpauth";

/**
 * Generate TOTP secret SEKALI SAJA untuk admin
 * ⚠️ JALANKAN FUNGSI INI HANYA 1X SAAT SETUP AWAL
 */
export function generateTOTPSecret() {
  // ✅ Generate secret yang akan FIXED selamanya
  const secret = new OTPAuth.Secret({size: 20});

  const totp = new OTPAuth. TOTP({
    issuer: "Sistem Absensi",
    label: "Admin QR",
    algorithm: "SHA1",
    digits: 6,
    period:  30,
    secret: secret
  });

  return {
    secret: secret.base32,
    uri: totp.toString()
  };
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(token, secretBase32) {
  try {
    console.log("=== VERIFY TOTP ===");
    console.log("Token input:", token);
    console.log("Secret:", secretBase32);
    
    const secret = OTPAuth.Secret.fromBase32(secretBase32);
    
    const totp = new OTPAuth.TOTP({
      issuer: "Sistem Absensi",
      label: "Admin QR",
      algorithm:  "SHA1",
      digits:  6,
      period: 30,
      secret: secret
    });

    // Generate current token untuk compare
    const currentToken = totp.generate();
    console.log("Expected token:", currentToken);

    const delta = totp.validate({
      token: token,
      window: 1 // Allow ±30 seconds
    });

    console.log("Delta:", delta);
    console.log("Valid? ", delta !== null);

    return delta !== null;
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate current TOTP untuk testing
 */
export function generateCurrentTOTP(secretBase32) {
  try {
    const secret = OTPAuth.Secret.fromBase32(secretBase32);
    
    const totp = new OTPAuth.TOTP({
      issuer: "Sistem Absensi",
      label: "Admin QR",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret
    });

    return totp.generate();
  } catch (error) {
    console.error("TOTP generation error:", error);
    return null;
  }
}