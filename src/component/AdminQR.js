// src/components/AdminQR. js
import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { createQRSession } from "../utils/qrHelper";
import "./AdminQR.css";

const AdminQR = () => {
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Auto-generate QR setiap 5 menit
  useEffect(() => {
    generateQR();
    
    const interval = setInterval(() => {
      generateQR();
    }, 5 * 60 * 1000); // 5 menit

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (! qrData) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.floor((qrData.expiredAt - now) / 1000);
      
      if (remaining <= 0) {
        setTimeLeft(0);
        generateQR(); // Auto-refresh when expired
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrData]);

  const generateQR = async () => {
    setLoading(true);
    
    try {
      // Create session di Firebase
      const session = await createQRSession(5); // 5 menit
      
      // Buat QR Code berisi sessionId
      const qrContent = JSON.stringify({
        sessionId: session.sessionId,
        expiredAt: session.expiredAt
      });
      
      // Generate QR image
      const qrImageUrl = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 2,
        color: {
          dark: "#1a202c",
          light: "#ffffff"
        }
      });
      
      setQrData(session);
      setQrImage(qrImageUrl);
      
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Gagal membuat QR Code");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">🔐 Admin - QR Absensi</h1>
          <p className="admin-subtitle">Tampilkan QR Code untuk mahasiswa scan</p>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Membuat QR Code...</p>
          </div>
        )}

        {!loading && qrImage && (
          <div className="qr-display">
            <div className="qr-wrapper">
              <img src={qrImage} alt="QR Code Absensi" className="qr-image" />
            </div>

            <div className="qr-info">
              <div className="info-row">
                <span className="info-label">Session ID:</span>
                <span className="info-value mono">{qrData. sessionId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="status-badge active">● Aktif</span>
              </div>
              <div className="info-row">
                <span className="info-label">Berlaku selama:</span>
                <span className="timer">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <button className="btn-refresh" onClick={generateQR}>
              🔄 Generate QR Baru
            </button>
          </div>
        )}

        <div className="admin-footer">
          <p>✨ QR Code akan auto-refresh setiap 5 menit</p>
        </div>
      </div>
    </div>
  );
};

export default AdminQR;