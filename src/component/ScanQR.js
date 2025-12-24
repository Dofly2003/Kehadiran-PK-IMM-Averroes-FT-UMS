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
  const [messageType, setMessageType] = useState("info"); // ✅ info, warning, error, success
  const [cameraError, setCameraError] = useState(false);
  const isInitialized = useRef(false);

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
        console.log("Scanner already running");
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      setMessageType("info");
      
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(true);
      setMessage("❌ Tidak dapat mengakses kamera.  Pastikan izin kamera diaktifkan.");
      setMessageType("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    console.log("QR Scanned:", decodedText);
    
    if (! scanning) return;
    
    try {
      const qrData = JSON.parse(decodedText);
      const { sessionId } = qrData;

      await stopScanner();
      setScanning(false);
      setMessage("⏳ Memvalidasi QR Code...");
      setMessageType("info");

      // ✅ Validasi session
      const validation = await validateQRSession(sessionId);

      // ✅ QR EXPIRED - Tampilkan WARNING (bukan error)
      if (validation.expired) {
        setMessage(`⚠️ ${validation.message}`);
        setMessageType("warning"); // ✅ Warning kuning, bukan error merah
        
        setTimeout(() => {
          setMessage("📷 Arahkan kamera ke QR Code");
          setMessageType("info");
          isInitialized.current = false;
          startScanner();
        }, 4000);
        return;
      }

      // ✅ ERROR SISTEM (jaringan, dll)
      if (validation.isSystemError) {
        setMessage(`❌ ${validation.message}`);
        setMessageType("error"); // ✅ Error merah untuk sistem error
        
        setTimeout(() => {
          setMessage("📷 Arahkan kamera ke QR Code");
          setMessageType("info");
          isInitialized.current = false;
          startScanner();
        }, 4000);
        return;
      }

      // ✅ QR VALID
      if (validation.valid) {
        setMessage("✅ QR Valid!  Mengarahkan ke form absensi.. .");
        setMessageType("success");
        
        setTimeout(() => {
          navigate(`/absensi? session=${sessionId}`);
        }, 1000);
        return;
      }

      // ✅ QR TIDAK VALID (tapi bukan expired)
      setMessage(`⚠️ ${validation.message}`);
      setMessageType("warning");
      
      setTimeout(() => {
        setMessage("📷 Arahkan kamera ke QR Code");
        setMessageType("info");
        isInitialized.current = false;
        startScanner();
      }, 3000);
      
    } catch (error) {
      console.error("QR Parse error:", error);
      setMessage("⚠️ QR Code tidak valid. Scan ulang.");
      setMessageType("warning"); // ✅ QR rusak = warning, bukan error
      
      setTimeout(() => {
        setMessage("📷 Arahkan kamera ke QR Code");
        setMessageType("info");
        isInitialized.current = false;
        startScanner();
      }, 2000);
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore
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

        {/* ✅ Status Message dengan warna berbeda */}
        <div className={`scan-message ${messageType}`}>
          {message}
        </div>

        {cameraError && (
          <div className="error-help">
            <p><strong>Troubleshooting:</strong></p>
            <ul>
              <li>Pastikan browser memiliki izin kamera</li>
              <li>Gunakan HTTPS (bukan HTTP)</li>
              <li>Coba refresh halaman</li>
            </ul>
          </div>
        )}

        {!cameraError && (
          <button className="btn-back" onClick={() => navigate("/")}>
            ← Kembali
          </button>
        )}
      </div>
    </div>
  );
};

export default ScanQR;