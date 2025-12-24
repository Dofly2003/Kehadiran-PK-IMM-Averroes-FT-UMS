// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AbsensiList from "./component/AbsensiList";
import Navbar from "./component/nav";
import AbsensiHariIni from "./component/kehadiranHariIni";
import LogAbsen from "./component/logAbsen";
import AbsenPerTanggal from "./component/absensipertanggal";
import AdminQR from "./component/AdminQR";
import ScanQR from "./component/ScanQR";
import AbsensiForm from "./component/AbsensiForm";
import SetupAuthenticator from './component/SetupAuthenticator';

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh" }}>
        <Navbar />      
        <Routes>
          <Route path="/" element={<AbsensiHariIni />} />
          <Route path="/tambah-member" element={<AbsensiList />} />
          <Route path="/log-absen" element={<LogAbsen />} />
          <Route path="/absensi/:tanggal" element={<AbsenPerTanggal />} />
          <Route path="/barcode" element={<AdminQR />} />        
          <Route path="/scan" element={<ScanQR />} />
          
          {/* ✅ Route absensi form */}
          <Route path="/absensi" element={<AbsensiForm />} />
          
          <Route path="/setup-authenticator" element={<SetupAuthenticator />} />
          
          {/* ✅ Catch-all 404 route */}
          <Route path="*" element={
            <div style={{ 
              padding: "40px", 
              textAlign:  "center",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}>
              <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>404</h1>
              <p>Halaman tidak ditemukan</p>
              <button 
                onClick={() => window.location.href = "/"}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#60a5fa",
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                ← Kembali ke Home
              </button>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;