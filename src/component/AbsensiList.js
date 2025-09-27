// src/components/AbsensiList.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";

const AbsensiList = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedUID, setSelectedUID] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    bidang: "",
  });

  // Ambil data absensi dari struktur baru (tahun/bulan/minggu/hari/uid)
  useEffect(() => {
    const absensiRef = ref(db, "absensi/");
    onValue(absensiRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const arr = [];

        // Loop ke dalam folder tahun → bulan → minggu → hari → uid
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

        // Ambil hanya absensi terakhir per UID
        const latestPerUID = {};
        arr.forEach((row) => {
          if (
            !latestPerUID[row.uid] ||
            new Date(row.waktu) > new Date(latestPerUID[row.uid].waktu)
          ) {
            latestPerUID[row.uid] = row;
          }
        });

        // Konversi ke array lagi & urutkan berdasarkan waktu terbaru
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
      const val = snapshot.val();
      if (val) setUsers(val);
    });
  }, []);

  // Submit form daftar
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!selectedUID) return;

    if (users[selectedUID]?.nama) {
      alert("⚠ UID ini sudah terdaftar, tidak bisa diupdate lagi!");
      setSelectedUID(null);
      setFormData({ nama: "", nim: "", bidang: "" });
      return;
    }

    try {
      await set(ref(db, "users/" + selectedUID), {
        nama: formData.nama,
        nim: formData.nim,
        bidang: formData.bidang,
      });

      alert("✅ User berhasil didaftarkan!");
      setSelectedUID(null);
      setFormData({ nama: "", nim: "", bidang: "" });
    } catch (err) {
      console.error("Gagal daftar:", err);
    }
  };

  // Pisahkan absensi
  const sudahTerdaftar = data.filter((row) => users[row.uid]?.nama);
  const belumTerdaftar = data.filter((row) => !users[row.uid]?.nama);

  return (
    <div className="container mt-5">
      <h2 className="fw-bold text-center mb-4">📋 Data Absensi</h2>

      {/* Belum Terdaftar */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-danger text-white fw-bold">
          ❌ Belum Terdaftar
        </div>
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-danger">
              <tr>
                <th>UID</th>
                <th>Nama</th>
                <th>NIM</th>
                <th>Bidang</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {belumTerdaftar.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted fst-italic">
                    Semua UID sudah terdaftar 🎉
                  </td>
                </tr>
              ) : (
                belumTerdaftar.map((row) => (
                  <tr key={row.id}>
                    <td>{row.uid}</td>
                    <td className="text-muted">Belum Terdaftar</td>
                    <td>-</td>
                    <td>-</td>
                    <td>{row.waktu}</td>
                    <td>
                      <span className="badge bg-danger">Belum Terdaftar</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setSelectedUID(row.uid)}
                      >
                        Daftarkan
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
      <div className="card shadow-sm">
        <div className="card-header bg-success text-white fw-bold">
          ✔ Sudah Terdaftar
        </div>
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-success">
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
                  <td colSpan="6" className="text-center text-muted fst-italic">
                    Belum ada data terdaftar
                  </td>
                </tr>
              ) : (
                sudahTerdaftar.map((row) => {
                  const user = users[row.uid] || {};
                  return (
                    <tr key={row.id}>
                      <td>{row.uid}</td>
                      <td className="fw-semibold">{user.nama}</td>
                      <td>{user.nim}</td>
                      <td>{user.bidang}</td>
                      <td>{row.waktu}</td>
                      <td>
                        <span className="badge bg-success">✔ Terdaftar</span>
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
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Daftarkan UID: {selectedUID}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedUID(null)}
                ></button>
              </div>
              <form onSubmit={handleRegister}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">NIM</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nim}
                      onChange={(e) =>
                        setFormData({ ...formData, nim: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bidang</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.bidang}
                      onChange={(e) =>
                        setFormData({ ...formData, bidang: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">
                    Simpan
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
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
  );
};

export default AbsensiList;
