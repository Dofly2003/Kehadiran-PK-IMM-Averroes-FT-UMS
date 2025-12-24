// src/components/AdminQR.js
import React, { useState, useEffect } from "react";
import { createQRSession } from "../utils/qrHelper";
import { verifyTOTP } from "../utils/setupAdmin";
import QRCode from "qrcode";
import "./AdminQR.css";

const AdminQR = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [countdown, setCountdown] = useState(30);

  const TOTP_SECRET = process.env.REACT_APP_TOTP_SECRET;

  // Debug:  Log secret saat component mount
  useEffect(() => {
    console.log("TOTP_SECRET dari . env:", TOTP_SECRET);
    console.log("TOTP_SECRET ada? ", !!TOTP_SECRET);
  }, [TOTP_SECRET]);

  // Check session
  useEffect(() => {
    const authTime = localStorage.getItem("admin_auth_time");
    if (authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      if (elapsed < 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("admin_auth_time");
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
        setCountdown(seconds);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleTOTPSubmit = (e) => {
    e.preventDefault();
    setAuthError("");

    console.log("=== DEBUG TOTP ===");
    console.log("Input code:", totpCode);
    console.log("Secret:", TOTP_SECRET);

    if (! TOTP_SECRET) {
      setAuthError("TOTP secret belum di-setup!  Jalankan /setup-authenticator dulu.");
      return;
    }

    const isValid = verifyTOTP(totpCode, TOTP_SECRET);
    console.log("Verification result:", isValid);

    if (isValid) {
      console.log("✅ Kode valid!");
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth_time", Date.now().toString());
      setAuthError("");
      setTotpCode("");
    } else {
      console.log("❌ Kode salah!");
      setAuthError("Kode salah!  Pastikan kode dari Authenticator App.");
      setTotpCode("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth_time");
    setQrCodeUrl("");
    setSessionData(null);
  };

  const generateQR = async () => {
    try {
      const duration = 5;
      const session = await createQRSession(duration);
      
      const qrPayload = {
        sessionId:  session.sessionId,
        expiredAt: session.expiredAt
      };

      const qrString = JSON.stringify(qrPayload);
      const qrImage = await QRCode.toDataURL(qrString, {
        width: 400,
        margin: 2
      });

      setQrCodeUrl(qrImage);
      setSessionData(session);
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Gagal generate QR Code");
    }
  };

  if (! isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-container" style={{maxWidth: "450px"}}>
          <div className="admin-header">
            <h1 className="admin-title">🔐 Admin Verification</h1>
            <p className="admin-subtitle">
              Masukkan kode 6 digit dari Authenticator App
            </p>
          </div>

          <form onSubmit={handleTOTPSubmit}>
            <div className="form-group">
              <label className="form-label">
                🔢 Kode Authenticator (6 digit)
              </label>
              <input
                type="text"
                className="form-control flat-input"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value. replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                pattern="[0-9]{6}"
                autoFocus
                style={{
                  fontSize: "24px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  fontFamily: "monospace"
                }}
              />
              <small style={{color: "#a0aec0", display: "block", marginTop: "8px"}}>
                Buka <strong>Google Authenticator</strong> atau <strong>Microsoft Authenticator</strong>
              </small>
            </div>

            {authError && (
              <div className="alert alert-danger">
                ❌ {authError}
              </div>
            )}

            {/* Debug info */}
            <div style={{
              background: "#f7fafc",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "12px",
              fontFamily: "monospace"
            }}>
              <div>Secret loaded: {TOTP_SECRET ?  "✅ Yes" : "❌ No"}</div>
              <div>Secret: {TOTP_SECRET ?  TOTP_SECRET. substring(0, 8) + "..." : "Not found"}</div>
            </div>

            <button 
              type="submit" 
              className="btn btn-gradient"
              disabled={totpCode.length !== 6}
            >
              🔓 Verifikasi & Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">⚙️ Admin QR Code</h1>
          <p className="admin-subtitle">
            ✅ Terverifikasi | Kode baru dalam:  <strong>{countdown}s</strong>
          </p>
          <button 
            onClick={handleLogout}
            className="btn btn-sm btn-outline-danger"
            style={{marginTop: "10px"}}
          >
            🚪 Logout
          </button>
        </div>

        <button className="btn-refresh" onClick={generateQR}>
          🔄 Generate QR Code Baru
        </button>

        {qrCodeUrl && (
          <div className="qr-display">
            <div className="qr-wrapper">
              <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
            </div>

            {sessionData && (
              <div className="qr-info">
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="status-badge active">🟢 Aktif</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dibuat:</span>
                  <span className="info-value">
                    {new Date(sessionData.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Berlaku sampai:</span>
                  <span className="info-value">
                    {new Date(sessionData.expiredAt).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="admin-footer">
          🔒 Protected dengan 2FA Authenticator
        </p>
      </div>
    </div>
  );
};

export default AdminQR;