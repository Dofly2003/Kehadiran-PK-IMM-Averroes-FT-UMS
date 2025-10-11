// src/components/AbsensiLog.js
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./logAbsen.css";

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
    const rows = (data[tanggal] || []).map((row) => {
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

  const tanggalList = Object.keys(data).sort().reverse();

  return (
    <div className="absensi-log-page">
      <div className="container-xl px-2 px-sm-3">
        {/* Header */}
        <div className="page-header">
          <div className="title-wrap">
            <span className="badge-soft">Log</span>
            <h2 className="page-title">📑 Log Absensi Harian</h2>
            <p className="page-subtitle">Data absensi mahasiswa tersimpan berdasarkan tanggal</p>
          </div>
        </div>

        {tanggalList.length === 0 && (
          <div className="empty-state my-3">Belum ada data absensi.</div>
        )}

        {/* Accordion per tanggal */}
        <div className="accordion glass-accordion" id="accordionAbsensi">
          {tanggalList.map((tanggal, index) => {
            const rows = data[tanggal];
            const dayName = getDayName(tanggal);
            const formattedDate = formatDate(tanggal);
            const collapseId = `collapse-${index}`;
            const headingId = `heading-${index}`;

            return (
              <div className="accordion-item glass-item" key={tanggal}>
                <h2 className="accordion-header" id={headingId}>
                  <button
                    className="accordion-button glass-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${collapseId}`}
                    aria-expanded="false"
                    aria-controls={collapseId}
                  >
                    <div className="header-left">
                      <span className="dot green" />
                      <span className="date-title">
                        {dayName}, {formattedDate}
                      </span>
                    </div>
                    <span className="count-pill green ms-auto">{rows.length} orang</span>
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
                        className="btn btn-gradient"
                        onClick={() => downloadExcelPerHari(tanggal)}
                      >
                        ⬇ Download Excel Hari Ini
                      </button>
                    </div>

                    {/* List-style rows */}
                    <div className="list-table">
                      {rows.map((row) => {
                        const user = users[row.uid] || {};
                        return (
                          <div key={row.id} className="list-row">
                            <div className="list-cell">
                              <div className="list-label">UID</div>
                              <div className="list-value mono">{row.uid}</div>
                            </div>
                            <div className="list-cell">
                              <div className="list-label">Nama</div>
                              <div className="list-value fw-semibold">
                                {user.nama || "Belum Terdaftar"}
                              </div>
                            </div>
                            <div className="list-cell">
                              <div className="list-label">NIM</div>
                              <div className="list-value mono">{user.nim || "-"}</div>
                            </div>
                            <div className="list-cell">
                              <div className="list-label">Bidang</div>
                              <div className="list-value">{user.bidang || "-"}</div>
                            </div>
                            <div className="list-cell">
                              <div className="list-label">Waktu</div>
                              <div className="list-value">{row.waktu}</div>
                            </div>
                            <div className="list-cell status ms-auto">
                              <div className="list-label">Status</div>
                              <div className="list-value">
                                <span className="status-dot green" /> Hadir
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="footer-note">
          <small>© {new Date().getFullYear()} Sistem Absensi Mahasiswa</small>
        </div>
      </div>
    </div>
  );
};

export default AbsensiLog;