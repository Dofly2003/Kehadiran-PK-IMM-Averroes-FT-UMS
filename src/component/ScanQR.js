// src/components/ScanQR.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { validateQRSession } from "../utils/qrHelper";
import "./ScanQR.css";

const ScanQR = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [cameraError, setCameraError] = useState(false);
  const isInitialized = useRef(false);
  const processingRef = useRef(false); // ✅ Prevent double scan

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        console.log("⚠️ Scanner already running");
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // ✅ Disable flip untuk performa lebih baik
          disableFlip: false
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      setMessageType("info");
      processingRef.current = false; // ✅ Reset processing flag
      
      console.log("✅ Scanner started successfully");
      
    } catch (error) {
      console.error("❌ Camera error:", error);
      setCameraError(true);
      setMessage("❌ Tidak dapat mengakses kamera.  Pastikan izin kamera diaktifkan.");
      setMessageType("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log("✅ Scanner stopped");
      } catch (error) {
        console.error("⚠️ Error stopping scanner:", error);
        scannerRef.current = null;
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    // ✅ Prevent double processing
    if (processingRef. current) {
      console.log("⚠️ Already processing, ignoring scan");
      return;
    }

    console.log("📷 QR Scanned:", decodedText);
    
    if (! scanning) {
      console.log("⚠️ Not in scanning mode");
      return;
    }

    processingRef.current = true; // ✅ Lock processing
    
    try {
      // ✅ Parse QR code
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
        console.log("✅ Parsed QR data:", qrData);
      } catch (parseError) {
        console.error("❌ Parse error:", parseError);
        setMessage("⚠️ QR Code tidak valid!  Format salah.");
        setMessageType("warning");
        
        setTimeout(() => {
          resetScanner();
        }, 2000);
        return;
      }

      // ✅ Validasi struktur QR
      if (! qrData.sessionId || !qrData.expiredAt) {
        console.error("❌ QR incomplete:", qrData);
        setMessage("⚠️ QR Code tidak lengkap! Minta QR baru dari admin.");
        setMessageType("warning");
        
        setTimeout(() => {
          resetScanner();
        }, 3000);
        return;
      }

      const { sessionId } = qrData;

      // Stop scanner sebelum validasi
      await stopScanner();
      setScanning(false);
      setMessage("⏳ Memvalidasi QR Code...");
      setMessageType("info");

      // ✅ Validasi session
      console.log("🔍 Validating session:", sessionId);
      const validation = await validateQRSession(sessionId);
      console.log("📊 Validation result:", validation);

      // ✅ QR EXPIRED
      if (validation.expired) {
        console.log("⚠️ QR expired");
        setMessage(`⚠️ ${validation.message}`);
        setMessageType("warning");
        
        setTimeout(() => {
          resetScanner();
        }, 4000);
        return;
      }

      // ✅ ERROR SISTEM
      if (validation.isSystemError) {
        console.log("❌ System error");
        setMessage(`❌ ${validation.message}`);
        setMessageType("error");
        
        setTimeout(() => {
          resetScanner();
        }, 4000);
        return;
      }

      // ✅ QR VALID
      if (validation.valid) {
        console.log("✅ QR valid, navigating to form");
        setMessage("✅ QR Valid! Mengarahkan ke form absensi.. .");
        setMessageType("success");
        
        setTimeout(() => {
          navigate(`/absensi? session=${sessionId}`);
        }, 1000);
        return;
      }

      // ✅ QR TIDAK VALID (lainnya)
      console.log("⚠️ QR invalid:", validation.message);
      setMessage(`⚠️ ${validation.message}`);
      setMessageType("warning");
      
      setTimeout(() => {
        resetScanner();
      }, 3000);
      
    } catch (error) {
      console.error("❌ Scan processing error:", error);
      setMessage("❌ Terjadi kesalahan:  " + error.message);
      setMessageType("error");
      
      setTimeout(() => {
        resetScanner();
      }, 3000);
    }
  };

  const resetScanner = () => {
    console.log("🔄 Resetting scanner.. .");
    processingRef.current = false;
    isInitialized.current = false;
    setMessage("📷 Arahkan kamera ke QR Code");
    setMessageType("info");
    startScanner();
  };

  const onScanError = (errorMessage) => {
    // ✅ Ignore scan errors (normal saat kamera mencari QR)
    // Jangan log untuk avoid console spam
  };

  return (
    <div className="scan-page">
      <div className="scan-container">
        <div className="scan-header">
          <h1 className="scan-title">📱 Scan QR Absensi</h1>
          <p className="scan-subtitle">Arahkan kamera ke QR Code dari admin</p>
        </div>

        <div className="qr-reader-wrapper">
          <div id="qr-reader"></div>
        </div>

        {/* ✅ Status Message */}
        {message && (
          <div className={`scan-message ${messageType}`}>
            {message}
          </div>
        )}

        {/* ✅ Camera Error Help */}
        {cameraError && (
          <div className="error-help">
            <p><strong>⚠️ Troubleshooting:</strong></p>
            <ul>
              <li>Pastikan browser memiliki izin kamera</li>
              <li>Gunakan HTTPS (bukan HTTP)</li>
              <li>Coba refresh halaman</li>
              <li>Coba browser lain (Chrome/Firefox)</li>
            </ul>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
              style={{marginTop: "12px"}}
            >
              🔄 Refresh Halaman
            </button>
          </div>
        )}

        {/* ✅ Back Button */}
        {! cameraError && (
          <button className="btn-back" onClick={() => navigate("/")}>
            ← Kembali
          </button>
        )}
      </div>
    </div>
  );
};

export default ScanQR;