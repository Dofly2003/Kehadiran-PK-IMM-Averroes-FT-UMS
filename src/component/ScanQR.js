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
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const processingRef = useRef(false);
  const scanCountRef = useRef(0); // ✅ Track scan attempts

  // Manual input mode
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // ✅ Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        console.log("📷 Available cameras:", devices);
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritas kamera belakang
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label. toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera ?  backCamera. id : devices[0].id);
        } else {
          console.error("❌ No cameras found");
          setCameraError(true);
          setMessage("❌ Tidak ada kamera yang terdeteksi!");
          setMessageType("error");
        }
      })
      .catch((err) => {
        console.error("❌ Error getting cameras:", err);
        setCameraError(true);
        setMessage("❌ Gagal mengakses kamera:  " + err.message);
        setMessageType("error");
      });
  }, []);

  // ✅ Start scanner when camera selected
  useEffect(() => {
    if (selectedCamera && !manualMode && !scanning && !scannerRef.current) {
      console.log("🚀 Starting scanner with camera:", selectedCamera);
      startScanner(selectedCamera);
    }

    return () => {
      stopScanner();
    };
  }, [selectedCamera, manualMode]);

  const startScanner = async (cameraId) => {
    try {
      if (scannerRef.current) {
        console.log("⚠️ Scanner already exists");
        return;
      }

      console.log("🎬 Initializing scanner.. .");
      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false // ✅ Disable verbose logging
      });
      scannerRef.current = html5QrCode;

      // ✅ Optimized config for better detection
      const config = {
        fps: 30, // ✅ Increase FPS dari 10 ke 30
        qrbox: { width: 280, height: 280 }, // ✅ Larger scan box
        aspectRatio: 1.0,
        disableFlip: false,
        // ✅ Enable experimental features
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        // ✅ Video constraints untuk kualitas lebih baik
        videoConstraints: {
          facingMode: "environment",
          focusMode: "continuous", // ✅ Continuous autofocus
          advanced: [
            { zoom: 1.0 }
          ]
        }
      };

      console.log("📸 Starting camera with config:", config);
      
      await html5QrCode.start(
        cameraId,
        config,
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      setMessageType("info");
      processingRef.current = false;
      scanCountRef.current = 0;
      
      console.log("✅ Scanner started successfully!");
      
    } catch (error) {
      console.error("❌ Scanner start error:", error);
      setCameraError(true);
      setMessage("❌ Gagal memulai scanner: " + error.message);
      setMessageType("error");
      scannerRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        console.log("🛑 Stopping scanner...");
        const state = scannerRef.current.getState();
        
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        
        await scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
        console.log("✅ Scanner stopped");
      } catch (error) {
        console.error("⚠️ Error stopping scanner:", error);
        scannerRef.current = null;
        setScanning(false);
      }
    }
  };

  const processQRData = async (decodedText) => {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 QR DETECTED! Raw data:");
      console.log(decodedText);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // ✅ Trim whitespace
      const cleanedText = decodedText.trim();
      console.log("🧹 Cleaned text:", cleanedText);

      // Parse QR code
      let qrData;
      try {
        qrData = JSON.parse(cleanedText);
        console.log("✅ Parsed QR data:", qrData);
        console.log("   - sessionId:", qrData.sessionId);
        console.log("   - expiredAt:", qrData.expiredAt);
      } catch (parseError) {
        console.error("❌ JSON Parse error:", parseError);
        console.log("Raw text length:", cleanedText.length);
        console.log("First 50 chars:", cleanedText.substring(0, 50));
        setMessage("⚠️ QR Code tidak valid!  Format bukan JSON.");
        setMessageType("warning");
        return false;
      }

      // Validasi struktur
      if (!qrData.sessionId) {
        console.error("❌ Missing sessionId");
        setMessage("⚠️ QR tidak ada sessionId!");
        setMessageType("warning");
        return false;
      }

      if (!qrData.expiredAt) {
        console.error("❌ Missing expiredAt");
        setMessage("⚠️ QR tidak ada expiredAt!");
        setMessageType("warning");
        return false;
      }

      const { sessionId } = qrData;

      setMessage("⏳ Memvalidasi QR Code...");
      setMessageType("info");

      // Validasi session
      console.log("🔍 Validating session:", sessionId);
      const validation = await validateQRSession(sessionId);
      console.log("📊 Validation result:", validation);

      if (validation.expired) {
        console.log("⚠️ QR Expired");
        setMessage(`⚠️ ${validation.message}`);
        setMessageType("warning");
        return false;
      }

      if (validation. isSystemError) {
        console.log("❌ System Error");
        setMessage(`❌ ${validation.message}`);
        setMessageType("error");
        return false;
      }

      if (validation.valid) {
        console.log("✅✅✅ QR VALID!  ✅✅✅");
        console.log("📍 Navigating to:  /absensi?session=" + sessionId);
        
        setMessage("✅ QR Valid! Mengarahkan ke form absensi...");
        setMessageType("success");
        
        // ✅ Navigate langsung tanpa setTimeout
        setTimeout(() => {
          const targetPath = `/absensi?session=${sessionId}`;
          console.log("🚀 EXECUTING NAVIGATE to:", targetPath);
          navigate(targetPath);
          console.log("✅ Navigate executed");
        }, 1500);
        
        return true;
      }

      console.log("⚠️ QR Invalid:", validation.message);
      setMessage(`⚠️ ${validation.message}`);
      setMessageType("warning");
      return false;

    } catch (error) {
      console.error("❌ Processing error:", error);
      console.error("Stack trace:", error.stack);
      setMessage("❌ Error:  " + error.message);
      setMessageType("error");
      return false;
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // ✅ Increment scan counter
    scanCountRef. current++;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🎯 QR CODE SCANNED! (Attempt #${scanCountRef.current})`);
    console.log("Decoded text:", decodedText);
    console.log("Decoded result:", decodedResult);
    console.log("Processing ref:", processingRef.current);
    console.log("Scanning:", scanning);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (processingRef.current) {
      console.log("⚠️ Already processing, ignoring scan");
      return;
    }

    if (! scanning) {
      console.log("⚠️ Not in scanning mode, ignoring");
      return;
    }

    // ✅ Lock processing immediately
    processingRef.current = true;
    console.log("🔒 Processing locked");
    
    // Stop scanner
    console.log("🛑 Stopping scanner for processing.. .");
    await stopScanner();

    // Process QR
    const success = await processQRData(decodedText);

    if (! success) {
      console.log("❌ Processing failed, restarting scanner in 3 seconds.. .");
      setTimeout(() => {
        processingRef.current = false;
        scanCountRef.current = 0;
        if (selectedCamera) {
          startScanner(selectedCamera);
        }
      }, 3000);
    } else {
      console.log("✅ Processing successful!  Navigation should happen.. .");
    }
  };

  const onScanError = (errorMessage) => {
    // ✅ Completely silent, hanya log setiap 100 attempts
    if (! window.qrScanErrorCount) window.qrScanErrorCount = 0;
    window.qrScanErrorCount++;
    
    if (window.qrScanErrorCount % 100 === 0) {
      console.log(`📊 Scan attempts:  ${window.qrScanErrorCount} (searching for QR... )`);
    }
  };

  // Manual submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualInput.trim()) {
      setMessage("⚠️ Masukkan QR string!");
      setMessageType("warning");
      return;
    }

    const success = await processQRData(manualInput);
    
    if (! success) {
      setMessage("❌ Validasi gagal!  Cek console untuk detail.");
      setMessageType("error");
    }
  };

  // Toggle manual mode
  const toggleManualMode = async () => {
    if (! manualMode) {
      await stopScanner();
    } else {
      if (selectedCamera) {
        startScanner(selectedCamera);
      }
    }
    setManualMode(!manualMode);
    setMessage("");
  };

  // Change camera
  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value;
    console.log("📷 Changing camera to:", newCameraId);
    
    await stopScanner();
    setSelectedCamera(newCameraId);
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

        {/* Camera Selector */}
        {! manualMode && cameras.length > 1 && (
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">📷 Pilih Kamera:</label>
            <select
              className="form-control flat-input"
              value={selectedCamera || ""}
              onChange={handleCameraChange}
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggle Manual Mode */}
        <button
          className="btn btn-secondary"
          onClick={toggleManualMode}
          style={{ marginBottom: "16px", width: "100%" }}
        >
          {manualMode ? "🔄 Kembali ke Scanner" : "⌨️ Input Manual (Debug)"}
        </button>

        {/* Manual Input Mode */}
        {manualMode ?  (
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
                  fontSize:  "12px"
                }}
              />
              <small style={{ color: "#a0aec0", display: "block", marginTop: "8px" }}>
                Copy QR String dari Admin QR (debug panel)
              </small>
            </div>
            <button
              type="submit"
              className="btn btn-gradient"
              style={{ width: "100%" }}
            >
              ✅ Validasi QR String
            </button>
          </form>
        ) : (
          // Scanner Mode
          <>
            {! cameraError && (
              <div className="qr-reader-wrapper">
                <div id="qr-reader"></div>
                {scanning && (
                  <div style={{
                    textAlign: "center",
                    marginTop: "12px",
                    padding: "12px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    borderRadius: "8px",
                    color: "#22c55e",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}>
                    🟢 Scanner Aktif (FPS: 30) - Scan Count: {scanCountRef.current}
                  </div>
                )}
                
                {/* ✅ Scan Tips */}
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background:  "rgba(96, 165, 250, 0.1)",
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#93c5fd"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: "8px" }}>💡 Tips untuk scan yang lebih baik:</div>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    <li>Jaga jarak 15-30 cm dari QR</li>
                    <li>Pastikan pencahayaan cukup</li>
                    <li>Tahan HP steady (jangan goyang)</li>
                    <li>Pastikan QR Code terlihat jelas di kotak</li>
                  </ul>
                </div>
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
        {cameraError && ! manualMode && (
          <div className="error-help">
            <p><strong>⚠️ Troubleshooting:</strong></p>
            <ul>
              <li>Pastikan browser memiliki izin kamera</li>
              <li>Gunakan HTTPS (bukan HTTP)</li>
              <li>Coba browser lain (Chrome recommended)</li>
              <li>Refresh halaman dan allow camera permission</li>
              <li>Atau gunakan <strong>Mode Manual</strong> untuk testing</li>
            </ul>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
              style={{ marginTop: "12px", width: "100%" }}
            >
              🔄 Refresh Halaman
            </button>
          </div>
        )}

        {/* Debug Info */}
        {! manualMode && (
          <div style={{
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            marginTop: "16px",
            fontSize: "12px",
            fontFamily: "monospace",
            color: "#1a202c"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>🔍 Debug Info:</div>
            <div>Scanner:  {scanning ? "🟢 Running" : "🔴 Stopped"}</div>
            <div>Camera: {selectedCamera ? "✅ Selected" : "❌ None"}</div>
            <div>Available cameras: {cameras.length}</div>
            <div>Processing: {processingRef.current ?  "🔒 Locked" : "🔓 Ready"}</div>
            <div>Scan attempts: {scanCountRef.current}</div>
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