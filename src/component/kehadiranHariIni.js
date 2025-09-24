// src/components/AbsensiHariIni.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AbsensiHariIni = () => {
  const [users, setUsers] = useState({});
  const [absensiHariIni, setAbsensiHariIni] = useState({});

  // Format tanggal hari ini
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const usersRef = ref(db, "users/");
    onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setUsers(val);
    });

    const absensiRef = ref(db, "absensi/");
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const todayData = {};
        Object.entries(val).forEach(([id, item]) => {
          if (item.waktu?.startsWith(today)) {
            todayData[id] = item;
          }
        });
        setAbsensiHariIni(todayData);
      }
    });
  }, []);

  const hadirUIDs = Object.values(absensiHariIni).map((row) => row.uid);

  const sudahHadir = Object.entries(users)
    .filter(([uid]) => hadirUIDs.includes(uid))
    .map(([uid, user]) => ({ uid, ...user }));

  const belumHadir = Object.entries(users)
    .filter(([uid]) => !hadirUIDs.includes(uid))
    .map(([uid, user]) => ({ uid, ...user }));

  // === Export ke Excel ===
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Sudah Hadir
    const sudahSheet = XLSX.utils.json_to_sheet(
      sudahHadir.map((row) => ({
        UID: row.uid,
        Nama: row.nama,
        NIM: row.nim,
        Bidang: row.bidang,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, sudahSheet, "Sudah Hadir");

    // Sheet 2: Belum Hadir
    const belumSheet = XLSX.utils.json_to_sheet(
      belumHadir.map((row) => ({
        UID: row.uid,
        Nama: row.nama,
        NIM: row.nim,
        Bidang: row.bidang,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, belumSheet, "Belum Hadir");

    // Simpan file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Absensi_${today}.xlsx`);
  };

  return (
    <div className="container mt-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold">Absensi Hari Ini</h2>
        <p className="text-muted">{today}</p>
        <button className="btn btn-success" onClick={exportToExcel}>
          📥 Download Excel
        </button>
      </div>

      <div className="row">
        {/* Sudah Absen */}
        <div className="col-md-6">
          <h5 className="text-success fw-bold mb-3">✔ Sudah Absen</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle shadow-sm">
              <thead className="table-success">
                <tr>
                  <th>UID</th>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Prodi</th>
                </tr>
              </thead>
              <tbody>
                {sudahHadir.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted fst-italic">
                      Belum ada yang absen
                    </td>
                  </tr>
                ) : (
                  sudahHadir.map((row) => (
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

        {/* Belum Absen */}
        <div className="col-md-6">
          <h5 className="text-danger fw-bold mb-3">❌ Belum Absen</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle shadow-sm">
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
                    <td colSpan="4" className="text-center text-muted fst-italic">
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
  );
};

export default AbsensiHariIni;
