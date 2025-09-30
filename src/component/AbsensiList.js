// src/components/AbsensiList.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";

const AbsensiList = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState({ terdaftar: {}, belum_terdaftar: {} });
  const [selectedUID, setSelectedUID] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    bidang: "",
  });

  // Ambil data absensi
  useEffect(() => {
    const absensiRef = ref(db, "absensi/");
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const arr = [];
        Object.entries(val).forEach(([tahun, bulanObj]) => {
          Object.entries(bulanObj).forEach(([bulan, mingguObj]) => {
            Object.entries(mingguObj).forEach(([minggu, hariObj]) => {
              Object.entries(hariObj).forEach(([hari, uidObj]) => {
                Object.entries(uidObj).forEach(([uid, item]) => {
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

        // Urutkan terbaru
        const uniqueArr = Object.values(latestPerUID).sort(
          (a, b) => new Date(b.waktu) - new Date(a.waktu)
        );
        setData(uniqueArr);
      }
    });
  }, []);

  // Ambil data users
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

  // Daftarkan user baru
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
    }
  };

  // Gabungkan absensi dengan data users
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
    <div
      className="min-vh-100 py-5 "
      style={{
        background: "linear-gradient(135deg, #0d1117, #1a1f2b)", // hitam ke biru gelap
        color: "#e0e0e0",
      }}
    >
      <div className="container">
        <h2 className="fw-bold text-center mb-5 text-primary">
          🎓 Manajemen Absensi Mahasiswa
        </h2>

        {/* Belum Terdaftar */}
        <div className="card shadow-lg mb-5 border-0 rounded-4">
          <div
            className="card-header fw-bold text-white rounded-top-4"
            style={{
              background: "linear-gradient(90deg, #000, #0d6efd)", // hitam → biru
            }}
          >
            ❌ Belum Terdaftar
          </div>
          <div className="card-body table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>UID</th>
                  <th>Nama</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {belumTerdaftar.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-muted fst-italic"
                    >
                      Semua UID sudah terdaftar 🎉
                    </td>
                  </tr>
                ) : (
                  belumTerdaftar.map((row) => (
                    <tr key={row.id}>
                      <td>{row.uid}</td>
                      <td className="text-muted">Belum Terdaftar</td>
                      <td>{row.waktu}</td>
                      <td>
                        <span className="badge bg-secondary">
                          Belum Terdaftar
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary rounded-pill"
                          onClick={() => setSelectedUID(row.uid)}
                        >
                          ➕ Daftarkan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sudah Terdaftar */}
        <div className="card shadow-lg border-0 rounded-4">
          <div
            className="card-header fw-bold text-white rounded-top-4"
            style={{
              background: "linear-gradient(90deg, #0d6efd, #000)", // biru → hitam
            }}
          >
            ✔ Sudah Terdaftar
          </div>
          <div className="card-body table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-primary">
                <tr>
                  <th>UID</th>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Bidang</th>
                  <th>Waktu</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sudahTerdaftar.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted fst-italic"
                    >
                      Belum ada data terdaftar
                    </td>
                  </tr>
                ) : (
                  sudahTerdaftar.map((row) => {
                    const user = users.terdaftar[row.uid] || {};
                    return (
                      <tr key={row.id}>
                        <td>{row.uid}</td>
                        <td className="fw-semibold text-dark">{user.nama}</td>
                        <td>{user.nim}</td>
                        <td>{user.bidang}</td>
                        <td>{row.waktu}</td>
                        <td>
                          <span className="badge bg-primary">
                            ✔ Terdaftar
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Daftar */}
        {selectedUID && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content rounded-4 shadow-lg">
                <div
                  className="modal-header text-white rounded-top-4"
                  style={{
                    background: "linear-gradient(90deg, #000, #0d6efd)",
                  }}
                >
                  <h5 className="modal-title">
                    ✍ Daftarkan UID: <span>{selectedUID}</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedUID(null)}
                  ></button>
                </div>
                <form onSubmit={handleRegister}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nama</label>
                      <input
                        type="text"
                        className="form-control rounded-pill"
                        value={formData.nama}
                        onChange={(e) =>
                          setFormData({ ...formData, nama: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">NIM</label>
                      <input
                        type="text"
                        className="form-control rounded-pill"
                        value={formData.nim}
                        onChange={(e) =>
                          setFormData({ ...formData, nim: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Bidang</label>
                      <input
                        type="text"
                        className="form-control rounded-pill"
                        value={formData.bidang}
                        onChange={(e) =>
                          setFormData({ ...formData, bidang: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-pill px-4"
                    >
                      ✅ Simpan
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary rounded-pill px-4"
                      onClick={() => setSelectedUID(null)}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsensiList;
