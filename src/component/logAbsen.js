// src/components/AbsensiLog.js
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const FIREBASE_URL =
  "https://absensi-organisasi-default-rtdb.asia-southeast1.firebasedatabase.app";

// Fungsi ambil nama hari
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { weekday: "long" });
};

// Fungsi format tanggal Indo
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AbsensiLog = () => {
  const [data, setData] = useState({});
  const [users, setUsers] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil absensi
        const res = await fetch(`${FIREBASE_URL}/absensi.json`);
        const json = await res.json();

        // Ambil users hanya yang terdaftar
        const resUsers = await fetch(`${FIREBASE_URL}/users/terdaftar.json`);
        const jsonUsers = await resUsers.json();
        if (jsonUsers) setUsers(jsonUsers);

        if (json) {
          const formatted = [];

          // Traverse struktur Firebase absensi
          Object.keys(json).forEach((tahun) => {
            Object.keys(json[tahun]).forEach((bulan) => {
              Object.keys(json[tahun][bulan]).forEach((minggu) => {
                Object.keys(json[tahun][bulan][minggu]).forEach((hari) => {
                  const uids = json[tahun][bulan][minggu][hari];
                  Object.keys(uids).forEach((uid) => {
                    formatted.push({
                      id: uid + "-" + uids[uid].waktu,
                      uid: uids[uid].uid,
                      waktu: uids[uid].waktu,
                      tanggal: `${tahun}-${bulan}-${hari}`, // yyyy-mm-dd
                    });
                  });
                });
              });
            });
          });

          // Group by tanggal
          const grouped = formatted.reduce((acc, item) => {
            if (!acc[item.tanggal]) acc[item.tanggal] = [];
            acc[item.tanggal].push(item);
            return acc;
          }, {});

          setData(grouped);
        }
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };

    fetchData();
  }, []);

  // Download Excel khusus 1 hari
  const downloadExcelPerHari = (tanggal) => {
    const rows = data[tanggal].map((row) => {
      const user = users[row.uid] || {};
      return {
        tanggal,
        uid: row.uid,
        nama: user.nama || "Belum Terdaftar",
        nim: user.nim || "-",
        bidang: user.bidang || "-",
        waktu: row.waktu,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
    XLSX.writeFile(wb, `log_absensi_${tanggal}.xlsx`);
  };

  return (
    <div
      className="min-vh-100 py-4"
      style={{
        background: "linear-gradient(135deg, #0d1117, #1a1f2b)", // dark theme
        color: "#e0e0e0",
      }}
    >
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-info">📑 Log Absensi Harian</h2>
          <p className="text-secondary">
            Data absensi mahasiswa tersimpan berdasarkan tanggal
          </p>
        </div>

        {Object.keys(data).length === 0 && (
          <div className="alert alert-info shadow-sm text-center">
            Belum ada data absensi.
          </div>
        )}

        <div className="accordion" id="accordionAbsensi">
          {Object.keys(data)
            .sort()
            .reverse()
            .map((tanggal, index) => {
              const rows = data[tanggal];
              const dayName = getDayName(tanggal);
              const formattedDate = formatDate(tanggal);
              const collapseId = `collapse-${index}`;
              const headingId = `heading-${index}`;

              return (
                <div
                  className="accordion-item mb-3 border-0 shadow-lg rounded-3"
                  style={{ background: "#161b22", color: "#e0e0e0" }}
                  key={tanggal}
                >
                  <h2 className="accordion-header" id={headingId}>
                    <button
                      className="accordion-button collapsed fw-semibold"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded="false"
                      aria-controls={collapseId}
                      style={{
                        background: "#0d6efd",
                        color: "white",
                      }}
                    >
                      📅 {dayName}, {formattedDate}{" "}
                      <span className="badge bg-light text-dark ms-2">
                        {rows.length} orang
                      </span>
                    </button>
                  </h2>
                  <div
                    id={collapseId}
                    className="accordion-collapse collapse"
                    aria-labelledby={headingId}
                    data-bs-parent="#accordionAbsensi"
                  >
                    <div className="accordion-body p-0">
                      <div className="d-flex justify-content-end p-3">
                        <button
                          className="btn btn-outline-info btn-sm shadow-sm fw-semibold"
                          onClick={() => downloadExcelPerHari(tanggal)}
                        >
                          ⬇ Download Excel Hari Ini
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                          <thead style={{ background: "#0d6efd" }}>
                            <tr>
                              <th>UID</th>
                              <th>Nama</th>
                              <th>NIM</th>
                              <th>Bidang</th>
                              <th>Waktu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => {
                              const user = users[row.uid] || {};
                              return (
                                <tr key={row.id}>
                                  <td>{row.uid}</td>
                                  <td>{user.nama || "Belum Terdaftar"}</td>
                                  <td>{user.nim || "-"}</td>
                                  <td>{user.bidang || "-"}</td>
                                  <td>{row.waktu}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AbsensiLog;
