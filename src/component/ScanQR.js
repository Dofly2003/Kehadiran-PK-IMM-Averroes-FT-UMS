// src/components/ScanQR.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./ScanQR.css";

const ScanQR = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const isInitialized = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [lastScan, setLastScan] = useState("");
  const processingRef = useRef(false);

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
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

      console.log("🚀 Starting scanner..  .");
      
      const readerElement = document.getElementById("qr-reader");
      if (readerElement) {
        readerElement.innerHTML = "";
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setMessage("📷 Arahkan kamera ke QR Code");
      setMessageType("info");
      
      console.log("✅ Scanner started successfully");
      
    } catch (error) {
      console.error("❌ Scanner error:", error);
      setMessage("❌ Gagal memulai kamera:   " + error.message);
      setMessageType("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        console.log("🛑 Stopping scanner...");
        const state = scannerRef.current.getState();
        
        if (state === 2) {
          await scannerRef.current.stop();
        }
        
        await scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
        
        const readerElement = document.getElementById("qr-reader");
        if (readerElement) {
          readerElement.innerHTML = "";
        }
        
        console.log("✅ Scanner stopped");
      } catch (err) {
        console.error("⚠️ Stop error:", err);
        scannerRef.current = null;
        setScanning(false);
      }
    }
  };

  const onScanSuccess = (decodedText) => {
    if (processingRef.current || decodedText === lastScan) {
      console.log("⚠️ Duplicate scan, ignoring");
      return;
    }

    processingRef.current = true;
    setLastScan(decodedText);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 QR CODE DETECTED!");
    console.log("Raw data:", decodedText);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    stopScanner();

    try {
      const qrData = JSON.parse(decodedText.  trim());
      console.log("✅ Parsed:", qrData);

      if (!  qrData.sessionId) {
        throw new Error("sessionId tidak ditemukan dalam QR");
      }

      // ✅ NAVIGATE KE FORM
      const targetUrl = `/absensi? session=${qrData.sessionId}`;
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🚀 NAVIGATING TO:", targetUrl);
      console.log("Session ID:", qrData.  sessionId);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      setMessage("✅ QR Valid! Membuka form absensi..  .");
      setMessageType("success");

      // ✅ Navigate dengan delay yang lebih pendek
      setTimeout(() => {
        console.log("🔗 Executing navigate()");
        navigate(targetUrl, { replace: true }); // ✅ Tambah replace:  true
        console.log("✅ Navigate called");
      }, 300); // ✅ Kurangi delay dari 500ms ke 300ms

    } catch (error) {
      console.error("❌ Processing error:", error);
      setMessage("⚠️ QR tidak valid:   " + error.message);
      setMessageType("error");
      
      setTimeout(() => {
        processingRef.current = false;
        setLastScan("");
        isInitialized.current = false;
        startScanner();
      }, 2000);
    }
  };

  const onScanError = (errorMessage) => {
    // Silent
  };

  const handleRetry = () => {
    processingRef.current = false;
    setLastScan("");
    setMessage("");
    isInitialized.current = false;
    startScanner();
  };

  return (
    <div className="scan-page">
      <div className="scan-container">
        <div className="scan-header">
          <h1 className="scan-title">📱 Scan QR Absensi</h1>
          <p className="scan-subtitle">Arahkan kamera ke QR Code dari admin</p>
        </div>

        <div className="qr-reader-wrapper">
          <div 
            id="qr-reader" 
            style={{ 
              width: "100%",
              minHeight: "300px"
            }}
          ></div>
          
          {scanning && (
            <div style={{
              marginTop: "12px",
              padding: "12px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "8px",
              textAlign: "center",
              color: "#22c55e",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              🟢 Scanner Aktif - Mencari QR Code...  
            </div>
          )}
        </div>

        {message && (
          <div 
            className={`scan-message ${messageType}`} 
            style={{
              padding: "16px",
              marginTop: "16px",
              borderRadius: "8px",
              textAlign: "center",
              background: messageType === "success" ? "rgba(34,197,94,0.15)" :
                         messageType === "error" ? "rgba(239,68,68,0.15)" :
                         "rgba(96,165,250,0.15)",
              border: messageType === "success" ?   "1px solid rgba(34,197,94,0.3)" :
                      messageType === "error" ? "1px solid rgba(239,68,68,0.3)" :
                      "1px solid rgba(96,165,250,0.3)",
              color: messageType === "success" ? "#22c55e" :   
                     messageType === "error" ? "#ef4444" :  
                     "#60a5fa",
              fontWeight: "600"
            }}
          >
            {message}
          </div>
        )}

        <div style={{
          marginTop: "16px",
          padding: "12px",
          background: "rgba(96, 165, 250, 0.1)",
          border: "1px solid rgba(96, 165, 250, 0.3)",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#93c5fd"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>💡 Tips Scan:  </div>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>Jaga jarak 15-30 cm dari QR</li>
            <li>Pastikan pencahayaan cukup terang</li>
            <li>Tahan HP steady (jangan goyang)</li>
            <li>Pastikan QR Code masuk dalam kotak scan</li>
          </ul>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          {!  scanning && (
            <button 
              onClick={handleRetry}
              style={{
                flex: 1,
                padding:   "12px",
                borderRadius: "8px",
                border: "1px solid rgba(34, 197, 94, 0.5)",
                background: "rgba(34, 197, 94, 0.1)",
                color: "#22c55e",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🔄 Scan Ulang
            </button>
          )}
          
          <button 
            onClick={() => navigate("/")}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#e8eeff",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;