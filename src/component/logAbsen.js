import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const FIREBASE_URL =
  "https://absensi-organisasi-default-rtdb.asia-southeast1.firebasedatabase.app/absensi.json";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(FIREBASE_URL);
        const json = await res.json();

        if (json) {
          const formatted = [];

          // Traverse struktur Firebase
          Object.keys(json).forEach((tahun) => {
            Object.keys(json[tahun]).forEach((bulan) => {
              Object.keys(json[tahun][bulan]).forEach((minggu) => {
                Object.keys(json[tahun][bulan][minggu]).forEach((hari) => {
                  const uids = json[tahun][bulan][minggu][hari];
                  Object.keys(uids).forEach((uid) => {
                    formatted.push({
                      id: uid,
                      uid: uids[uid].uid,
                      waktu: uids[uid].waktu,
                      device: uids[uid].device,
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
    const rows = data[tanggal].map((row) => ({
      tanggal,
      uid: row.uid,
      waktu: row.waktu,
      device: row.device,
    }));
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
                          <th>UID</th>
                          <th>Waktu</th>
                          <th>Device</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.uid}</td>
                            <td>{row.waktu}</td>
                            <td>{row.device}</td>
                          </tr>
                        ))}
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
