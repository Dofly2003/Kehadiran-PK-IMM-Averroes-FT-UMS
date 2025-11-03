// src/components/AbsensiHariIni.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// Pakai nama file CSS yang Anda kirim
import "./AbsensiHariIni.css";

// Helper: cari minggu ke berapa
function getWeekOfMonth(day) {
  return "minggu-" + (Math.floor((day - 1) / 7) + 1);
}

const AbsensiHariIni = () => {
  const [users, setUsers] = useState({});
  const [absensiHariIni, setAbsensiHariIni] = useState({});

  // Ambil info tanggal sekarang
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, "0");
  const hari = String(now.getDate()).padStart(2, "0");
  const minggu = getWeekOfMonth(now.getDate());

  const todayPath = `absensi/${tahun}/${bulan}/${minggu}/${hari}`;

  useEffect(() => {
    // Ambil data user
    const usersRef = ref(db, "users/terdaftar");
    onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      setUsers(val || {});
    });

    // Ambil data absensi hari ini
    const absensiRef = ref(db, todayPath);
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      setAbsensiHariIni(val || {});
    });
  }, [todayPath]);

  const hadirUIDs = Object.keys(absensiHariIni);

  let sudahHadir = hadirUIDs.map((uid) => ({
    uid,
    ...(users[uid] || {}),
    waktu: absensiHariIni[uid]?.waktu || "-",
  }));

  // Sort by waktu terbaru (fallback jika waktu tidak valid)
  sudahHadir.sort((a, b) => {
    const ta = Date.parse(a.waktu) || 0;
    const tb = Date.parse(b.waktu) || 0;
    return tb - ta;
  });

  const belumHadir = Object.entries(users)
    .filter(([uid]) => !hadirUIDs.includes(uid))
    .map(([uid, user]) => ({ uid, ...user }));

  // Ringkasan
  const totalSudah = sudahHadir.length;
  const totalBelum = belumHadir.length;

  // Buat tanggal dari variabel tahun, bulan, hari
  const date = new Date(`${tahun}-${bulan}-${hari}`);

  // Nama hari dalam bahasa Indonesia
  const hariList = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  // Ambil nama hari sesuai index dari getDay()
  const namaHari = hariList[date.getDay()];

  // === Export ke Excel ===
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const sudahSheet = XLSX.utils.json_to_sheet(
      sudahHadir.map((row) => ({
        UID: row.uid,
        Nama: row.nama || "-",
        NIM: row.nim || "-",
        Bidang: row.bidang || "-",
        Waktu: row.waktu || "-",
      }))
    );
    XLSX.utils.book_append_sheet(workbook, sudahSheet, "Sudah Hadir");

    const belumSheet = XLSX.utils.json_to_sheet(
      belumHadir.map((row) => ({
        UID: row.uid,
        Nama: row.nama || "-",
        NIM: row.nim || "-",
        Bidang: row.bidang || "-",
      }))
    );
    XLSX.utils.book_append_sheet(workbook, belumSheet, "Belum Hadir");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Absensi_${tahun}-${bulan}-${hari}.xlsx`);
  };

  // Helper tampilkan hanya jam dari string "YYYY-MM-DD HH:mm:ss"
  const onlyTime = (str) => (str && str.includes(" ") ? str.split(" ")[1] : str || "-");

  return (
    <div className="absensi-today-page">
      <div className="container-xl px-2 px-sm-3">
        {/* Header */}
        <div className="page-header">
          <div className="title-wrap">
            <span className="badge-soft">Monitoring</span>
            <h2 className="page-title">📋 Monitoring Absensi</h2>
            <p className="page-subtitle">
              {namaHari}, {tahun}-{bulan}-{hari}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-gradient w-100 w-sm-auto" onClick={exportToExcel}>
              📥 Download Excel
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="stats">
          <div className="stat-card stat-green">
            <div className="stat-label">Sudah Absen</div>
            <div className="stat-value">{totalSudah}</div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-label">Belum Absen</div>
            <div className="stat-value">{totalBelum}</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Sudah Absen */}
          <section className="section-card">
            <div className="section-header green">
              <div className="dot green" />
              <h5 className="m-0">✔ Sudah Absen</h5>
              <span className="count-pill green ms-auto">Total: {totalSudah}</span>
            </div>
            <div className="list-table">
              {sudahHadir.length === 0 ? (
                <div className="empty-state">Belum ada yang absen</div>
              ) : (
                sudahHadir.map((row) => (
                  <div key={row.uid} className="list-row">
                    <div className="list-cell">
                      <div className="list-label">Nama</div>
                      <div className="list-value fw-semibold">{row.nama || "-"}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">NIM</div>
                      <div className="list-value mono">{row.nim || "-"}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">Waktu</div>
                      <div className="list-value">{onlyTime(row.waktu)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Belum Absen */}
          <section className="section-card">
            <div className="section-header red">
              <div className="dot red" />
              <h5 className="m-0">❌ Belum Absen</h5>
              <span className="count-pill red ms-auto">Total: {totalBelum}</span>
            </div>
            <div className="list-table">
              {belumHadir.length === 0 ? (
                <div className="empty-state">Semua sudah absen 🎉</div>
              ) : (
                belumHadir.map((row) => (
                  <div key={row.uid} className="list-row">
                    <div className="list-cell">
                      <div className="list-label">Nama</div>
                      <div className="list-value fw-semibold">{row.nama || "-"}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">NIM</div>
                      <div className="list-value mono">{row.nim || "-"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="footer-note">
          <small>© {tahun} Sistem Absensi Mahasiswa</small>
        </div>
      </div>
    </div>
  );
};

export default AbsensiHariIni;