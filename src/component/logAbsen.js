// src/components/AbsensiLog.js
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./logAbsen.css";

const FIREBASE_URL =
  "https://absensi-organisasi-default-rtdb.asia-southeast1.firebasedatabase.app";

// Ambil angka pertama (1-2 digit) dari token, misal "09-00" -> "09", "error-16-00" -> "16"
const extractFirstNumber = (token) => {
  if (!token || typeof token !== "string") return null;
  const m = token.match(/(\d{1,2})/);
  return m ? String(Number(m[1])) : null; // normalize to no-leading-zero string
};

const pad2 = (n) => String(n).padStart(2, "0");

const parseYMD = (ymd) => {
  if (!ymd || typeof ymd !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const getDayName = (dateStr) => {
  const date = parseYMD(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr || "—";
  return date.toLocaleDateString("id-ID", { weekday: "long" });
};

const formatDate = (dateStr) => {
  const date = parseYMD(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr || "—";
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
        const res = await fetch(`${FIREBASE_URL}/absensi.json`);
        const json = await res.json();

        const resUsers = await fetch(`${FIREBASE_URL}/users/terdaftar.json`);
        const jsonUsers = await resUsers.json();
        if (jsonUsers) setUsers(jsonUsers);

        if (json) {
          const formatted = [];
          const problematic = [];

          Object.keys(json).forEach((tahun) => {
            Object.keys(json[tahun] || {}).forEach((bulanToken) => {
              Object.keys(json[tahun][bulanToken] || {}).forEach((minggu) => {
                Object.keys(json[tahun][bulanToken][minggu] || {}).forEach((hariToken) => {
                  const uids = json[tahun][bulanToken][minggu][hariToken];
                  if (!uids || typeof uids !== "object") return;
                  Object.keys(uids).forEach((uid) => {
                    const entry = uids[uid] || {};
                    // coba ekstrak angka dari token (tolerant)
                    const monthNum = extractFirstNumber(bulanToken);
                    const dayNum = extractFirstNumber(hariToken);

                    let tanggalKey;
                    let flagged = false;

                    if (monthNum && dayNum) {
                      tanggalKey = `${tahun}-${pad2(monthNum)}-${pad2(dayNum)}`;
                    } else {
                      // fallback: gunakan raw token sehingga tidak hilang,
                      // juga tandai sebagai problematic
                      tanggalKey = `${tahun}-${bulanToken}-${hariToken}`;
                      flagged = true;
                    }

                    const item = {
                      id: uid + "-" + (entry.waktu || ""),
                      uid: entry.uid || uid,
                      waktu: entry.waktu || "",
                      tanggal: tanggalKey,
                      rawKeys: { tahun, bulanToken, minggu, hariToken },
                      flagged,
                    };

                    if (flagged) problematic.push(item);
                    formatted.push(item);
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

          console.info("[AbsensiLog] total entries:", formatted.length);
          console.info("[AbsensiLog] problematic entries (flagged):", problematic);
          console.info("[AbsensiLog] sample tanggalList:", Object.keys(grouped).slice(0, 50));

          setData(grouped);
        }
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };

    fetchData();
  }, []);

  // Download Excel khusus 1 hari
  // Perubahan: file Excel hanya menyertakan nama, nim, bidang, waktu (tidak termasuk UID/rawPath)
  const downloadExcelPerHari = (tanggal) => {
    const rows = (data[tanggal] || []).map((row) => {
      const user = users[row.uid] || {};
      return {
        tanggal,
        nama: user.nama || "Belum Terdaftar",
        nim: user.nim || "-",
        bidang: user.bidang || "-",
        waktu: row.waktu || "-",
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

        <div style={{ marginBottom: 12 }}>
          <small>NOTE: entries flagged sebagai problematic akan menampilkan tanda "(problematic)" pada baris.</small>
        </div>

        <div className="accordion glass-accordion" id="accordionAbsensi">
          {tanggalList.map((tanggal, index) => {
            const rows = data[tanggal] || [];
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

                    <div className="list-table">
                      {rows.map((row) => {
                        const user = users[row.uid] || {};
                        return (
                          <div key={row.id} className="list-row">
                            {/* UID column removed as requested */}
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

                            {/* Raw Path column removed as requested */}

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

        <div className="footer-note">
          <small>© {new Date().getFullYear()} Sistem Absensi Mahasiswa</small>
        </div>
      </div>
    </div>
  );
};

export default AbsensiLog;