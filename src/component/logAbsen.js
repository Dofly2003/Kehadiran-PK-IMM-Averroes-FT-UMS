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

        // Ambil users
        const resUsers = await fetch(`${FIREBASE_URL}/users.json`);
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
        nama: user.nama || "Belum Terdaftar",
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
    <div className="container py-4">
      <h2 className="mb-3 text-center">📑 Log Absensi Harian</h2>

      {Object.keys(data).length === 0 && (
        <div className="alert alert-info">Belum ada data absensi.</div>
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
              <div className="accordion-item" key={tanggal}>
                <h2 className="accordion-header" id={headingId}>
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${collapseId}`}
                    aria-expanded="false"
                    aria-controls={collapseId}
                  >
                    📅 {dayName}, {formattedDate} ({rows.length} orang)
                  </button>
                </h2>
                <div
                  id={collapseId}
                  className="accordion-collapse collapse"
                  aria-labelledby={headingId}
                  data-bs-parent="#accordionAbsensi"
                >
                  <div className="accordion-body p-0">
                    <div className="d-flex justify-content-end p-2">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => downloadExcelPerHari(tanggal)}
                      >
                        ⬇ Download Excel Hari Ini
                      </button>
                    </div>
                    <table className="table table-striped table-bordered mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Nama</th>
                          <th>Bidang</th>
                          <th>Waktu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const user = users[row.uid] || {};
                          return (
                            <tr key={row.id}>
                              <td>{user.nama || "Belum Terdaftar"}</td>
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
            );
          })}
      </div>
    </div>
  );
};

export default AbsensiLog;
