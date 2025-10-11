// ===================== AbsensiList.js =====================
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, remove, update, get } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AbsensiList.css"; // tampilan fresh list-style

const AbsensiList = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState({ terdaftar: {}, belum_terdaftar: {} });
  const [selectedUID, setSelectedUID] = useState(null);
  const [formData, setFormData] = useState({ nama: "", nim: "", bidang: "" });

  // ================= Ambil Data Absensi =================
  useEffect(() => {
    const absensiRef = ref(db, "absensi/");
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const arr = [];
        Object.entries(val).forEach(([tahun, bulanObj]) => {
          Object.entries(bulanObj || {}).forEach(([bulan, mingguObj]) => {
            Object.entries(mingguObj || {}).forEach(([minggu, hariObj]) => {
              Object.entries(hariObj || {}).forEach(([hari, uidObj]) => {
                Object.entries(uidObj || {}).forEach(([uid, item]) => {
                  arr.push({
                    id: `${tahun}-${bulan}-${minggu}-${hari}-${uid}`,
                    uid,
                    waktu: item.waktu,
                  });
                });
              });
            });
          });
        });

        // Ambil absensi terakhir per UID
        const latestPerUID = {};
        arr.forEach((row) => {
          if (
            !latestPerUID[row.uid] ||
            new Date(row.waktu) > new Date(latestPerUID[row.uid].waktu)
          ) {
            latestPerUID[row.uid] = row;
          }
        });

        const uniqueArr = Object.values(latestPerUID).sort(
          (a, b) => new Date(b.waktu) - new Date(a.waktu)
        );
        setData(uniqueArr);
      } else {
        setData([]);
      }
    });
  }, []);

  // ================= Ambil Data Users =================
  useEffect(() => {
    const usersRef = ref(db, "users/");
    onValue(usersRef, (snapshot) => {
      const val = snapshot.val() || {};
      const belum = {};

      if (val.belum_terdaftar) {
        Object.entries(val.belum_terdaftar).forEach(([uid, item]) => {
          belum[uid] = {
            waktu: item.waktu || "-",
            nama: item.nama || "Belum Terdaftar",
            bidang: item.bidang || "-",
          };
        });
      }

      setUsers({
        terdaftar: val.terdaftar || {},
        belum_terdaftar: belum,
      });
    });
  }, []);

  // ================= Daftarkan User =================
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedUID) return;

    if (users.terdaftar[selectedUID]?.nama) {
      alert("⚠ UID ini sudah terdaftar!");
      setSelectedUID(null);
      setFormData({ nama: "", nim: "", bidang: "" });
      return;
    }

    try {
      const now = new Date();
      const waktuString = now.toISOString().replace("T", " ").substring(0, 19);

      await set(ref(db, "users/terdaftar/" + selectedUID), {
        nama: formData.nama,
        nim: formData.nim,
        bidang: formData.bidang,
        waktu: waktuString,
      });

      await remove(ref(db, "users/belum_terdaftar/" + selectedUID));

      alert("✅ User berhasil didaftarkan!");
      setSelectedUID(null);
      setFormData({ nama: "", nim: "", bidang: "" });
    } catch (err) {
      console.error("Gagal daftar:", err);
      alert("❌ Gagal mendaftarkan user. Periksa console.");
    }
  };

  // ================= Hapus UID (data user saja) =================
  const handleDeleteUID = async (uid, type) => {
    if (window.confirm(`Yakin ingin menghapus UID ${uid}?`)) {
      try {
        if (type === "belum") {
          await remove(ref(db, "users/belum_terdaftar/" + uid));
        } else if (type === "terdaftar") {
          await remove(ref(db, "users/terdaftar/" + uid));
        }
        alert("🗑 UID berhasil dihapus!");
      } catch (err) {
        console.error("Gagal hapus UID:", err);
        alert("❌ Gagal menghapus UID. Periksa console.");
      }
    }
  };

  // ================= Hapus seluruh absensi berdasarkan UID =================
  const deleteAbsensiByUID = async (uid) => {
    const absensiRootRef = ref(db, "absensi/");
    const snapshot = await get(absensiRootRef);
    if (!snapshot.exists()) return 0;

    const val = snapshot.val();
    const updates = {};
    let count = 0;

    Object.entries(val || {}).forEach(([tahun, bulanObj]) => {
      Object.entries(bulanObj || {}).forEach(([bulan, mingguObj]) => {
        Object.entries(mingguObj || {}).forEach(([minggu, hariObj]) => {
          Object.entries(hariObj || {}).forEach(([hari, uidObj]) => {
            if (uidObj && uidObj[uid]) {
              updates[`absensi/${tahun}/${bulan}/${minggu}/${hari}/${uid}`] = null;
              count++;
            }
          });
        });
      });
    });

    if (count > 0) {
      await update(ref(db), updates);
    }
    return count;
  };

  const handleDeleteAbsensi = async (uid) => {
    if (!uid) return;
    const ok = window.confirm(
      `Yakin ingin menghapus SELURUH riwayat absensi untuk UID ${uid}?`
    );
    if (!ok) return;

    try {
      const deleted = await deleteAbsensiByUID(uid);
      if (deleted > 0) {
        alert(`🧹 Berhasil menghapus ${deleted} entri absensi untuk UID ${uid}.`);
      } else {
        alert("ℹ Tidak ada data absensi yang ditemukan untuk UID ini.");
      }
    } catch (err) {
      console.error("Gagal hapus absensi:", err);
      alert("❌ Gagal menghapus absensi. Periksa console.");
    }
  };

  // ================= Gabung Absensi + Users =================
  const sudahTerdaftar = Object.entries(users.terdaftar || {})
    .map(([uid, user]) => {
      const absenList = data.filter((row) => row.uid === uid);
      const latestAbsen =
        absenList.length > 0
          ? absenList.reduce((a, b) =>
              new Date(a.waktu) > new Date(b.waktu) ? a : b
            )
          : null;

      return {
        id: uid,
        uid,
        nama: user.nama,
        nim: user.nim,
        bidang: user.bidang,
        waktu: latestAbsen ? latestAbsen.waktu : user.waktu || "-",
      };
    })
    .sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

  const belumTerdaftar = Object.entries(users.belum_terdaftar || {})
    .map(([uid, item]) => ({
      id: uid,
      uid,
      waktu: item.waktu || "-",
      nama: item.nama || "Belum Terdaftar",
    }))
    .sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

  return (
    <div className="absensi-page">
      <div className="container-xl px-2 px-sm-3">
        <div className="page-header">
          <div className="title-wrap">
            <span className="badge-soft">Dashboard</span>
            <h2 className="page-title">Manajemen Absensi Mahasiswa</h2>
            <p className="page-subtitle">Kelola UID, pendaftaran, dan riwayat absensi</p>
          </div>
        </div>

        {/* ================= Belum Terdaftar ================= */}
        <section className="section-card">
          <div className="section-header amber">
            <div className="dot amber" />
            <h5 className="m-0">Belum Terdaftar</h5>
            <span className="count-pill amber ms-auto">UID: {belumTerdaftar.length}</span>
          </div>

          <div className="list-table">
            {belumTerdaftar.length === 0 ? (
              <div className="empty-state">Semua UID sudah terdaftar 🎉</div>
            ) : (
              belumTerdaftar.map((row) => (
                <div key={row.id} className="list-row">
                  <div className="list-cell">
                    <div className="list-label">UID</div>
                    <div className="list-value mono">{row.uid}</div>
                  </div>
                  <div className="list-cell">
                    <div className="list-label">Waktu</div>
                    <div className="list-value">{row.waktu}</div>
                  </div>
                  <div className="list-cell status">
                    <div className="list-label">Status</div>
                    <div className="list-value">
                      <span className="status-dot gray" /> Belum terdaftar
                    </div>
                  </div>
                  <div className="list-cell actions ms-auto">
                    <button
                      className="btn btn-gradient btn-sm"
                      onClick={() => setSelectedUID(row.uid)}
                    >
                      ➕ Daftarkan
                    </button>
                    <button
                      className="btn btn-outline-amber btn-sm"
                      onClick={() => handleDeleteAbsensi(row.uid)}
                    >
                      🧹 Hapus Absensi
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteUID(row.uid, "belum")}
                    >
                      🗑 Hapus UID
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ================= Sudah Terdaftar ================= */}
        <section className="section-card">
          <div className="section-header blue">
            <div className="dot blue" />
            <h5 className="m-0">Sudah Terdaftar</h5>
            <span className="count-pill blue ms-auto">Mahasiswa: {sudahTerdaftar.length}</span>
          </div>

          <div className="list-table">
            {sudahTerdaftar.length === 0 ? (
              <div className="empty-state">Belum ada data terdaftar</div>
            ) : (
              sudahTerdaftar.map((row) => {
                const user = users.terdaftar[row.uid] || {};
                return (
                  <div key={row.id} className="list-row">
                    <div className="list-cell">
                      <div className="list-label">Nama</div>
                      <div className="list-value fw-semibold">{user.nama}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">NIM</div>
                      <div className="list-value mono">{user.nim}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">Bidang</div>
                      <div className="list-value">{user.bidang}</div>
                    </div>
                    <div className="list-cell">
                      <div className="list-label">Waktu</div>
                      <div className="list-value">{row.waktu}</div>
                    </div>
                    <div className="list-cell status">
                      <div className="list-label">Status</div>
                      <div className="list-value">
                        <span className="status-dot green" /> Terdaftar
                      </div>
                    </div>
                    <div className="list-cell actions ms-auto">
                      <button
                        className="btn btn-outline-amber btn-sm"
                        onClick={() => handleDeleteAbsensi(row.uid)}
                      >
                        🧹 Hapus Absensi
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteUID(row.uid, "terdaftar")}
                      >
                        🗑 Hapus UID
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ================= Modal Daftar ================= */}
      {selectedUID && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(2,6,23,0.65)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content modal-glass">
              <div className="modal-header modal-header-gradient">
                <h5 className="modal-title">
                  ✍ Daftarkan UID: <span className="mono">{selectedUID}</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedUID(null)}></button>
              </div>
              <form onSubmit={handleRegister}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nama</label>
                    <input
                      type="text"
                      className="form-control pill"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">NIM</label>
                    <input
                      type="text"
                      className="form-control pill mono"
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                      placeholder="Contoh: 22.11.1234"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-semibold">Bidang</label>
                    <input
                      type="text"
                      className="form-control pill"
                      value={formData.bidang}
                      onChange={(e) => setFormData({ ...formData, bidang: e.target.value })}
                      placeholder="Contoh: Backend / Frontend / IoT"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer gap-2">
                  <button type="submit" className="btn btn-gradient px-4">✅ Simpan</button>
                  <button type="button" className="btn btn-ghost px-4" onClick={() => setSelectedUID(null)}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsensiList;