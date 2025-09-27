import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";

const FIREBASE_URL =
  "https://absensi-organisasi-default-rtdb.asia-southeast1.firebasedatabase.app/absensi.json";

// Fungsi ambil nama hari
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { weekday: "long" });
};

// Fungsi ambil tanggal format Indo
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

  // Load data dari Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(FIREBASE_URL);
        const json = await res.json();
        if (json) {
          // Format data
          const formatted = Object.keys(json).map((key) => ({
            id: key,
            uid: json[key].uid,
            waktu: json[key].waktu,
            status: json[key].status,
            device: json[key].device,
          }));

          // Group by tanggal (yyyy-mm-dd)
          const grouped = formatted.reduce((acc, item) => {
            const tanggal = item.waktu.split(" ")[0]; // ambil yyyy-mm-dd
            if (!acc[tanggal]) acc[tanggal] = [];
            acc[tanggal].push(item);
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

  // Download ke Excel
  const downloadExcel = () => {
    const allRows = Object.keys(data).flatMap((tanggal) =>
      data[tanggal].map((row) => ({
        tanggal,
        uid: row.uid,
        waktu: row.waktu,
        status: row.status,
        device: row.device,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
    XLSX.writeFile(wb, "log_absensi.xlsx");
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3 text-center">📑 Data Absensi</h2>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success" onClick={downloadExcel}>
          ⬇ Download Excel
        </button>
      </div>

      {Object.keys(data).length === 0 && (
        <div className="alert alert-info">Belum ada data absensi.</div>
      )}

      {Object.keys(data)
        .sort()
        .reverse()
        .map((tanggal) => {
          const rows = data[tanggal];
          const dayName = getDayName(tanggal);
          const formattedDate = formatDate(tanggal);

          return (
            <div className="card mb-4" key={tanggal}>
              <div className="card-header bg-primary text-white">
                {dayName}, {formattedDate}
              </div>
              <div className="card-body p-0">
                <table className="table table-striped table-bordered mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>UID</th>
                      <th>Waktu</th>
                      <th>Status</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.uid}</td>
                        <td>{row.waktu}</td>
                        <td>
                          <span
                            className={`badge ${
                              row.status === "unregistered"
                                ? "bg-danger"
                                : "bg-success"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>{row.device}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default AbsensiLog;
