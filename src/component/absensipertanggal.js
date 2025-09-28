import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AbsensiHari = () => {
  const { tanggal } = useParams();
  const [users, setUsers] = useState({});
  const [absensi, setAbsensi] = useState({});

  useEffect(() => {
    const usersRef = ref(db, "users/");
    onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setUsers(val);
    });

    // Split tanggal jadi tahun, bulan, hari
    const [tahun, bulan, hari] = tanggal.split("-");
    const absensiRef = ref(db, `absensi/${tahun}/${bulan}/minggu-4/${hari}`);
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setAbsensi(val);
      else setAbsensi({});
    });
  }, [tanggal]);

  const hadirUIDs = Object.keys(absensi);
  const sudahHadir = hadirUIDs.map((uid) => ({
    uid,
    ...(users[uid] || {}),
    waktu: absensi[uid]?.waktu || "-",
  }));
  const belumHadir = Object.entries(users)
    .filter(([uid]) => !hadirUIDs.includes(uid))
    .map(([uid, user]) => ({ uid, ...user }));

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

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Absensi_${tanggal}.xlsx`);
  };

  return (
    <div className="container mt-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold">Absensi Hari Ini</h2>
        <p className="text-muted">{tanggal}</p>
        <button className="btn btn-success" onClick={exportToExcel}>
          📥 Download Excel
        </button>
      </div>
      <div className="row">
        {/* Sudah Absen */}
        <div className="col-md-6">
          <h5 className="text-success fw-bold mb-3">✔ Sudah Absen</h5>
          <table className="table table-hover">
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
                  <td colSpan="5" className="text-center text-muted">
                    Belum ada yang absen
                  </td>
                </tr>
              ) : (
                sudahHadir.map((row) => (
                  <tr key={row.uid}>
                    <td>{row.uid}</td>
                    <td>{row.nama || "-"}</td>
                    <td>{row.nim || "-"}</td>
                    <td>{row.bidang || "-"}</td>
                    <td>{row.waktu}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Belum Absen */}
        <div className="col-md-6">
          <h5 className="text-danger fw-bold mb-3">❌ Belum Absen</h5>
          <table className="table table-hover">
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
                  <td colSpan="4" className="text-center text-muted">
                    Semua sudah absen 🎉
                  </td>
                </tr>
              ) : (
                belumHadir.map((row) => (
                  <tr key={row.uid}>
                    <td>{row.uid}</td>
                    <td>{row.nama}</td>
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
  );
};

export default AbsensiHari;
