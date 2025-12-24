// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AbsensiList from "./component/AbsensiList";
import Navbar from "./component/nav";
import AbsensiHariIni from "./component/kehadiranHariIni"; // pastikan nama & path sesuai
import LogAbsen from "./component/logAbsen"; // pastikan nama & path sesuai
import AbsenPerTanggal from "./component/absensipertanggal"; // pastikan nama & path sesuai
import AbsensiScan from "./component/AbsensiScan";
import AdminQR from "./component/AdminQR";
import ScanQR from "./component/ScanQR";
import AbsensiForm from "./component/AbsensiForm";
import SetupAuthenticator from './component/SetupAuthenticator'; // ✅ Temporary

function App() {
  return (
    <Router>
      <Navbar />      
      <Routes>
        <Route path="/" element={<AbsensiHariIni />} />
        {/* <Route path="/scan" element={<AbsensiScan />} /> */}
        <Route path="/tambah-member" element={<AbsensiList />} />
        <Route path="/log-absen" element={<LogAbsen />} />
        <Route path="/absensi/:tanggal" element={<AbsenPerTanggal />} />
        <Route path="/barcode" element={<AdminQR />} />        
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/absensi" element={<AbsensiForm />} />
        <Route path="/setup-authenticator" element={<SetupAuthenticator />} />
      </Routes>
    </Router>
  );
}

export default App;
