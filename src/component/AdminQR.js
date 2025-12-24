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
  const [qrString, setQrString] = useState(""); // ✅ Store QR string untuk debug

  const TOTP_SECRET = process.env.REACT_APP_TOTP_SECRET;

  useEffect(() => {
    console.log("🔑 TOTP_SECRET:", TOTP_SECRET ?  "Loaded" : "Missing");
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

    if (! TOTP_SECRET) {
      setAuthError("TOTP secret belum di-setup!  Jalankan /setup-authenticator dulu.");
      return;
    }

    const isValid = verifyTOTP(totpCode, TOTP_SECRET);

    if (isValid) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth_time", Date.now().toString());
      setAuthError("");
      setTotpCode("");
    } else {
      setAuthError("Kode salah! Pastikan kode dari Authenticator App.");
      setTotpCode("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth_time");
    setQrCodeUrl("");
    setSessionData(null);
    setQrString("");
  };

  // ✅ Generate QR dengan error correction tinggi
  const generateQR = async () => {
    try {
      const duration = 5; // 5 menit
      const session = await createQRSession(duration);
      
      const qrPayload = {
        sessionId:  session.sessionId,
        expiredAt: session.expiredAt
      };

      const qrStr = JSON.stringify(qrPayload);
      
      // ✅ Debug logs
      console.log("📋 QR Payload:", qrPayload);
      console.log("📋 QR String:", qrStr);
      console.log("📋 Session:", session);

      // ✅ Test parse ulang untuk validasi
      try {
        const testParse = JSON.parse(qrStr);
        console.log("✅ QR dapat di-parse kembali:", testParse);
      } catch (parseErr) {
        console.error("❌ QR tidak bisa di-parse:", parseErr);
        alert("Error: QR payload tidak valid!");
        return;
      }

      // ✅ Generate QR dengan error correction level HIGH
      const qrImage = await QRCode.toDataURL(qrStr, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H', // ✅ High error correction (30%)
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrImage);
      setSessionData(session);
      setQrString(qrStr); // ✅ Simpan untuk display

      console.log("✅ QR Code berhasil di-generate!");
      
    } catch (error) {
      console.error("❌ Error generating QR:", error);
      alert("Gagal generate QR Code:  " + error.message);
    }
  };

  // ✅ Copy QR string untuk testing
  const copyQRString = () => {
    navigator.clipboard.writeText(qrString);
    alert("✅ QR string berhasil dicopy!  Paste di JSON validator untuk test.");
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
                onChange={(e) => setTotpCode(e.target. value. replace(/\D/g, "").slice(0, 6))}
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
              <small style={{color: "#a0aec0", display: "block", marginTop:  "8px"}}>
                Buka <strong>Google Authenticator</strong> atau <strong>Microsoft Authenticator</strong>
              </small>
            </div>

            {authError && (
              <div className="alert alert-danger">
                ❌ {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-gradient"
              disabled={totpCode.length !== 6}
            >
              🔓 Verifikasi & Masuk
            </button>
          </form>

          <div className="alert alert-info" style={{marginTop: "20px", fontSize: "13px"}}>
            💡 <strong>Belum setup? </strong><br />
            Akses <a href="/setup-authenticator">/setup-authenticator</a> untuk scan QR pertama kali
          </div>
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
            style={{marginTop:  "10px"}}
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
                  <span className="info-label">Dibuat: </span>
                  <span className="info-value">
                    {new Date(sessionData.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Berlaku sampai:</span>
                  <span className="info-value">
                    {new Date(sessionData. expiredAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Session ID:</span>
                  <span className="info-value mono" style={{fontSize: "11px"}}>
                    {sessionData. sessionId. substring(0, 25)}...
                  </span>
                </div>
              </div>
            )}

            {/* ✅ Debug Panel */}
            {qrString && (
              <div style={{
                background: "#f7fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "16px"
              }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#2d3748"
                }}>
                  🔍 Debug: QR String
                </div>
                <div style={{
                  background: "#fff",
                  padding: "8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  wordBreak: "break-all",
                  color: "#1a202c"
                }}>
                  {qrString}
                </div>
                <button
                  onClick={copyQRString}
                  className="btn btn-sm btn-outline-danger"
                  style={{marginTop: "8px", width: "100%"}}
                >
                  📋 Copy QR String (untuk testing)
                </button>
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