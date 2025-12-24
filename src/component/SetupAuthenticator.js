// src/components/SetupAuthenticator.js
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { generateTOTPSecret } from "../utils/setupAdmin";
import "./AdminQR.css";

const SetupAuthenticator = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setupAuthenticator();
  }, []);

  const setupAuthenticator = async () => {
    try {
      const { secret, uri } = generateTOTPSecret();
      
      // Generate QR untuk scan ke Google Authenticator
      const qrImage = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2
      });

      setQrCodeUrl(qrImage);
      setSecret(secret);
    } catch (error) {
      console.error("Error setup:", error);
      alert("Error generating setup QR:   " + error.message);
    }
  };

  const copySecret = () => {
    navigator. clipboard.writeText(secret);
    alert("✅ Secret berhasil dicopy!\n\nSimpan di file . env sebagai:\nREACT_APP_TOTP_SECRET=" + secret);
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🔐 Setup Authenticator</h1>
          <p className="admin-subtitle">Setup sekali saja untuk admin</p>
        </div>

        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          color: "#856404"
        }}>
          ⚠️ <strong>PENTING:</strong> Halaman ini hanya untuk setup awal. <br />
          Setelah selesai, hapus route ini dari production!
        </div>

        {qrCodeUrl ?  (
          <>
            <div className="qr-display">
              <h3 style={{ textAlign: "center", marginBottom:  "16px", color: "#1a202c" }}>
                📱 Langkah 1: Scan QR dengan Authenticator App
              </h3>
              
              <div className="qr-wrapper" style={{ textAlign: "center" }}>
                <img src={qrCodeUrl} alt="Setup QR" className="qr-image" style={{ maxWidth: "300px" }} />
              </div>

              <p style={{ textAlign: "center", color: "#718096", fontSize: "14px", marginTop: "16px" }}>
                Gunakan <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, 
                atau <strong>Authy</strong>
              </p>
            </div>

            <div className="qr-info" style={{ marginTop: "24px" }}>
              <h3 style={{ marginBottom: "16px", color: "#1a202c" }}>
                🔑 Langkah 2: Simpan Secret Key
              </h3>
              
              <div style={{ 
                background: "#f7fafc", 
                padding: "16px", 
                borderRadius:  "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                wordBreak: "break-all",
                marginBottom: "12px",
                border: "1px solid #e2e8f0",
                color: "#2d3748"
              }}>
                {showSecret ? secret : "••••••••••••••••••••••••••••"}
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom:  "16px" }}>
                <button 
                  className="btn btn-gradient"
                  onClick={() => setShowSecret(!showSecret)}
                  style={{ flex: 1, padding: "12px" }}
                >
                  {showSecret ? "🙈 Sembunyikan" : "👁️ Tampilkan"} Secret
                </button>
                
                <button 
                  className="btn btn-gradient"
                  onClick={copySecret}
                  style={{ flex:  1, padding: "12px" }}
                >
                  📋 Copy Secret
                </button>
              </div>

              <div style={{
                background: "#e3f2fd",
                border: "1px solid #90caf9",
                borderRadius: "10px",
                padding: "16px",
                fontSize: "13px",
                color: "#1565c0"
              }}>
                <strong>📝 Tambahkan ke file .env:</strong>
                <pre style={{ 
                  background: "#1a202c", 
                  color: "#fef08a", 
                  padding: "12px", 
                  borderRadius: "6px",
                  marginTop: "12px",
                  overflow: "auto",
                  fontSize: "12px"
                }}>
REACT_APP_TOTP_SECRET={secret}
                </pre>
              </div>
            </div>

            <div className="qr-info" style={{ marginTop: "24px" }}>
              <h3 style={{ marginBottom: "12px", color: "#1a202c" }}>
                ✅ Setelah Setup: 
              </h3>
              <ol style={{ paddingLeft: "20px", color: "#2d3748", lineHeight: "1.8" }}>
                <li>✅ Secret sudah tersimpan di Authenticator App Anda</li>
                <li>✅ Copy secret dan simpan di file <code>.env</code></li>
                <li>✅ Restart aplikasi:  <code>npm start</code></li>
                <li>✅ Akses <code>/admin-qr</code></li>
                <li>✅ Masukkan kode 6 digit dari Authenticator App</li>
                <li>⚠️ Hapus route <code>/setup-authenticator</code> dari <code>App.js</code></li>
              </ol>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#718096" }}>
            <div className="spinner" style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e2e8f0",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}></div>
            <p>Generating setup QR...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupAuthenticator;