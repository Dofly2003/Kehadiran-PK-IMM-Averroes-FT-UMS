// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AbsensiList from "./component/AbsensiList";
import AbsensiHariIni from "./component/kehadiranHariIni"; // pastikan nama & path sesuai

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AbsensiHariIni />} />
        <Route path="/TambahMember" element={<AbsensiList />} />
      </Routes>
    </Router>
  );
}

export default App;
