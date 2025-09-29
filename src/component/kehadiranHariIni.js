// src/components/AbsensiHariIni.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
    // Ambil data user
    const usersRef = ref(db, "users/terdaftar");
    onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setUsers(val);
      } else {
        setUsers({});
      }
    });


    // Ambil data absensi hari ini
    const absensiRef = ref(db, todayPath);
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setAbsensiHariIni(val);
      } else {
        setAbsensiHariIni({});
      }
    });
  }, [todayPath]);

  const hadirUIDs = Object.keys(absensiHariIni);

  let sudahHadir = hadirUIDs.map((uid) => ({
    uid,
    ...(users[uid] || {}),   // ambil nama, nim, bidang dari users/terdaftar
    waktu: absensiHariIni[uid]?.waktu || "-",
  }));

  sudahHadir.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));


  sudahHadir.sort((a, b) => (a.waktu < b.waktu ? 1 : -1));

  const belumHadir = Object.entries(users)
    .filter(([uid]) => !hadirUIDs.includes(uid))
    .map(([uid, user]) => ({ uid, ...user }));

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
        Nama: row.nama,
        NIM: row.nim,
        Bidang: row.bidang,
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

  return (
    <div
      className="min-vh-100 py-5"
      style={{
        background: "linear-gradient(135deg, #f0f4ff, #d9e4f5)",
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold text-primary">📋 Monitoring Absensi</h1>
          <p className="text-muted">
            {tahun}-{bulan}-{hari} ({minggu})
          </p>
          <button className="btn btn-success shadow-sm" onClick={exportToExcel}>
            📥 Download Excel
          </button>
        </div>

        <div className="row g-4">
          {/* Sudah Absen */}
          <div className="col-md-6">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-success text-white fw-bold rounded-top-4">
                ✔ Sudah Absen
              </div>
              <div className="card-body table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-success">
                    <tr>
                      <th>UID</th>
                      <th>Nama</th>
                      <th>NIM</th>
                      <th>Bidang</th>
                      <th>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sudahHadir.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-muted fst-italic"
                        >
                          Belum ada yang absen
                        </td>
                      </tr>
                    ) : (
                      sudahHadir.map((row) => (
                        <tr key={row.uid}>
                          <td>{row.uid}</td>
                          <td className="fw-semibold">{row.nama || "-"}</td>
                          <td>{row.nim || "-"}</td>
                          <td>{row.bidang || "-"}</td>
                          <td>{row.waktu}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Belum Absen */}
          <div className="col-md-6">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-danger text-white fw-bold rounded-top-4">
                ❌ Belum Absen
              </div>
              <div className="card-body table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-danger">
                    <tr>
                      <th>UID</th>
                      <th>Nama</th>
                      <th>NIM</th>
                      <th>Bidang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {belumHadir.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center text-muted fst-italic"
                        >
                          Semua sudah absen 🎉
                        </td>
                      </tr>
                    ) : (
                      belumHadir.map((row) => (
                        <tr key={row.uid}>
                          <td>{row.uid}</td>
                          <td className="fw-semibold">{row.nama}</td>
                          <td>{row.nim}</td>
                          <td>{row.bidang}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-muted">
          <small>© {tahun} Sistem Absensi Mahasiswa</small>
        </div>
      </div>
    </div>
  );
};

export default AbsensiHariIni;
