// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AbsensiList from "./component/AbsensiList";
import AbsensiHariIni from "./component/kehadiranHariIni"; // pastikan nama & path sesuai
import LogAbsen from "./component/logAbsen"; // pastikan nama & path sesuai
import AbsenPerTanggal from "./component/absensipertanggal"; // pastikan nama & path sesuai

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AbsensiHariIni />} />
        <Route path="/TambahMember" element={<AbsensiList />} />
        <Route path="/logAbsen" element={<LogAbsen />} />
        <Route path="/Absensi/:tanggal" element={<AbsenPerTanggal />} />
      </Routes>
    </Router>
  );
}

export default App;
