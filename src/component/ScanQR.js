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
  const processingRef = useRef(false);

  // ✅ Manual input mode
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    if (isInitialized.current || manualMode) return;
    isInitialized.current = true;

    startScanner();

    return () => {
      stopScanner();
    };
  }, [manualMode]);

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
          disableFlip: false
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      setMessageType("info");
      processingRef.current = false;

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
        if (state === 2) {
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

  const processQRData = async (decodedText) => {
    try {
      console.log("🔍 Processing QR:", decodedText);

      // Parse QR code
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
        console.log("✅ Parsed:", qrData);
      } catch (parseError) {
        console.error("❌ Parse error:", parseError);
        setMessage("⚠️ QR Code tidak valid!  Format salah.");
        setMessageType("warning");
        return false;
      }

      // Validasi struktur
      if (!qrData.sessionId || !qrData.expiredAt) {
        console.error("❌ Incomplete:", qrData);
        setMessage("⚠️ QR Code tidak lengkap!");
        setMessageType("warning");
        return false;
      }

      const { sessionId } = qrData;

      setMessage("⏳ Memvalidasi QR Code...");
      setMessageType("info");

      // Validasi session
      console.log("🔍 Validating:", sessionId);
      const validation = await validateQRSession(sessionId);
      console.log("📊 Result:", validation);

      if (validation.expired) {
        setMessage(`⚠️ ${validation.message}`);
        setMessageType("warning");
        return false;
      }

      if (validation.isSystemError) {
        setMessage(`❌ ${validation.message}`);
        setMessageType("error");
        return false;
      }

      if (validation.valid) {
        console.log("✅ QR VALID!");
        console.log("📍 Target URL:  /absensi? session=" + sessionId);

        setMessage("✅ QR Valid! Mengarahkan ke form absensi...");
        setMessageType("success");

        setTimeout(() => {
          const targetPath = `/absensi?session=${sessionId}`;
          console.log("🚀 Navigating to:", targetPath);
          navigate(targetPath);
        }, 1000);

        return true;
      }

      setMessage(`⚠️ ${validation.message}`);
      setMessageType("warning");
      return false;

    } catch (error) {
      console.error("❌ Processing error:", error);
      setMessage("❌ Error:  " + error.message);
      setMessageType("error");
      return false;
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (processingRef.current || !scanning) return;

    processingRef.current = true;
    await stopScanner();
    setScanning(false);

    const success = await processQRData(decodedText);

    if (!success) {
      setTimeout(() => {
        resetScanner();
      }, 3000);
    }
  };

  const resetScanner = () => {
    processingRef.current = false;
    isInitialized.current = false;
    setMessage("📷 Arahkan kamera ke QR Code");
    setMessageType("info");
    startScanner();
  };

  const onScanError = (errorMessage) => {
    // Ignore
  };

  // ✅ Manual submit handler
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualInput.trim()) {
      setMessage("⚠️ Masukkan QR string terlebih dahulu!");
      setMessageType("warning");
      return;
    }

    await processQRData(manualInput);
  };

  // ✅ Toggle manual mode
  const toggleManualMode = async () => {
    if (!manualMode) {
      await stopScanner();
      setScanning(false);
    }
    setManualMode(!manualMode);
    setMessage("");
  };

  return (
    <div className="scan-page">
      <div className="scan-container">
        <div className="scan-header">
          <h1 className="scan-title">📱 Scan QR Absensi</h1>
          <p className="scan-subtitle">
            {manualMode ? "Mode Manual Input" : "Arahkan kamera ke QR Code"}
          </p>
        </div>

        {/* ✅ Toggle Manual Mode */}
        <button
          className="btn btn-secondary"
          onClick={toggleManualMode}
          style={{ marginBottom: "16px", width: "100%" }}
        >
          {manualMode ? "🔄 Kembali ke Scanner" : "⌨️ Input Manual (Debug)"}
        </button>

        {/* ✅ Manual Input Mode */}
        {manualMode ? (
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label">Paste QR String:</label>
              <textarea
                className="form-control flat-input"
                rows="5"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder='{"sessionId":"qr_... ","expiredAt": 1234567890}'
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px"
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              ✅ Validasi QR String
            </button>
          </form>
        ) : (
          // Scanner Mode
          <>
            {!cameraError && (
              <div className="qr-reader-wrapper">
                <div id="qr-reader"></div>
              </div>
            )}
          </>
        )}

        {/* Status Message */}
        {message && (
          <div className={`scan-message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Camera Error Help */}
        {cameraError && !manualMode && (
          <div className="error-help">
            <p><strong>⚠️ Troubleshooting:</strong></p>
            <ul>
              <li>Pastikan browser memiliki izin kamera</li>
              <li>Gunakan HTTPS (bukan HTTP)</li>
              <li>Coba refresh halaman</li>
              <li>Atau gunakan <strong>Mode Manual</strong> di atas</li>
            </ul>
          </div>
        )}

        {/* Back Button */}
        <button
          className="btn-back"
          onClick={() => navigate("/")}
          style={{ marginTop: "16px" }}
        >
          ← Kembali
        </button>
      </div>
    </div>
  );
};

export default ScanQR;