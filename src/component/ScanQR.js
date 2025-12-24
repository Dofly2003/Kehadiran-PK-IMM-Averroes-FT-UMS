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
  const [cameraError, setCameraError] = useState(false);
  const isInitialized = useRef(false); // ✅ Prevent double initialization

  useEffect(() => {
    // ✅ Prevent double mount (React StrictMode)
    if (isInitialized.current) return;
    isInitialized.current = true;

    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      // ✅ Cek apakah scanner sudah ada
      if (scannerRef. current) {
        console.log("Scanner already running");
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(true);
      setMessage("❌ Tidak dapat mengakses kamera.  Pastikan izin kamera diaktifkan.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        // ✅ Cek state sebelum stop
        const state = scannerRef.current. getState();
        if (state === 2) { // 2 = SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null; // ✅ Reset ref
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    console.log("QR Scanned:", decodedText);
    
    // ✅ Prevent multiple scans
    if (! scanning) return;
    
    try {
      // Parse QR content
      const qrData = JSON.parse(decodedText);
      const { sessionId } = qrData;

      // Stop scanner
      await stopScanner();
      setScanning(false);
      setMessage("⏳ Memvalidasi QR Code.. .");

      // Validasi session
      const validation = await validateQRSession(sessionId);

      if (validation.valid) {
        setMessage("✅ QR Valid! Mengarahkan ke form absensi...");
        
        setTimeout(() => {
          navigate(`/absensi?session=${sessionId}`);
        }, 1000);
        
      } else {
        setMessage(`❌ ${validation.message}`);
        
        // Restart scanner setelah 3 detik
        setTimeout(() => {
          setMessage("📷 Arahkan kamera ke QR Code");
          isInitialized.current = false; // ✅ Reset flag
          startScanner();
        }, 3000);
      }
      
    } catch (error) {
      console.error("QR Parse error:", error);
      setMessage("❌ QR Code tidak valid. Scan ulang.");
      
      setTimeout(() => {
        setMessage("📷 Arahkan kamera ke QR Code");
        isInitialized.current = false; // ✅ Reset flag
        startScanner();
      }, 2000);
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore scan errors (terlalu banyak false positive)
    // console.log("Scan error:", errorMessage);
  };

  return (
    <div className="scan-page">
      <div className="scan-container">
        <div className="scan-header">
          <h1 className="scan-title">📱 Scan QR Absensi</h1>
          <p className="scan-subtitle">Arahkan kamera ke QR Code dari admin</p>
        </div>

        {/* QR Reader Container - ✅ Hanya 1 container */}
        <div className="qr-reader-wrapper">
          <div id="qr-reader"></div>
        </div>

        {/* Status Message */}
        <div className={`scan-message ${cameraError ?  'error' : ''}`}>
          {message}
        </div>

        {cameraError && (
          <div className="error-help">
            <p><strong>Troubleshooting: </strong></p>
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