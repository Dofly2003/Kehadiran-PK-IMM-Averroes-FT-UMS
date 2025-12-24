// src/components/AbsensiScan.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, get, set } from "firebase/database";
import { getTodayPath, formatDateTime } from "../utils/dateHelper";
import "./AbsensiScan.css";

const AbsensiScan = () => {
  // ========== STATE ==========
  const [users, setUsers] = useState({});           // Data users terdaftar
  const [inputNama, setInputNama] = useState("");   // Input search nama
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User yang dipilih
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // ========== FETCH USERS TERDAFTAR ==========
  useEffect(() => {
    const usersRef = ref(db, "users/terdaftar");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      setUsers(val || {});
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      showAlert("danger", "Gagal memuat data users");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ========== AUTOCOMPLETE FILTER ==========
  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (!inputNama. trim()) return false;
    const searchTerm = inputNama.toLowerCase();
    const nama = (user.nama || "").toLowerCase();
    return nama.includes(searchTerm);
  });

  // ========== HANDLER:  PILIH USER ==========
  const handleSelectUser = (uid, user) => {
    setSelectedUser({ uid, ... user });
    setInputNama(user.nama);
    setShowDropdown(false);
    setAlert({ show: false, type: "", message: "" });
  };

  // ========== HANDLER: CLEAR SELECTION ==========
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputNama(value);
    setSelectedUser(null);
    setShowDropdown(value. trim().length > 0);
  };

  // ========== SHOW ALERT ==========
  const showAlert = (type, message) => {
    setAlert({ show:  true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

  // ========== SUBMIT ABSENSI ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      showAlert("danger", "⚠️ Pilih nama dari daftar yang tersedia!");
      return;
    }

    setSubmitting(true);

    try {
      const { tahun, bulan, minggu, tanggal } = getTodayPath();
      const absensiPath = `absensi/${tahun}/${bulan}/${minggu}/${tanggal}/${selectedUser.uid}`;
      const absensiRef = ref(db, absensiPath);

      // ========== CEK DUPLIKASI ==========
      const snapshot = await get(absensiRef);
      
      if (snapshot.exists()) {
        const existingData = snapshot.val();
        showAlert(
          "info",
          `ℹ️ ${selectedUser.nama} sudah absen hari ini pada ${existingData.waktu}`
        );
        setSubmitting(false);
        return;
      }

      // ========== SIMPAN ABSENSI ==========
      const waktu = formatDateTime(new Date());
      await set(absensiRef, {
        nama: selectedUser.nama,
        uid: selectedUser.uid,
        waktu:  waktu
      });

      showAlert(
        "success",
        `✅ Absensi berhasil!  ${selectedUser.nama} tercatat pada ${waktu}`
      );

      // Reset form
      setInputNama("");
      setSelectedUser(null);
      setShowDropdown(false);

    } catch (error) {
      console.error("Error submitting absensi:", error);
      showAlert("danger", "❌ Gagal menyimpan absensi.  Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="scan-page">
      <div className="scan-container">
        {/* Header */}
        <div className="scan-header">
          <span className="scan-icon">📱</span>
          <h1 className="scan-title">Absensi QR</h1>
          <p className="scan-subtitle">Silakan pilih nama Anda untuk absen</p>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="loading">⏳ Memuat data...</div>}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleSubmit}>
            {/* Input Nama */}
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ketik nama Anda..."
                value={inputNama}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(inputNama.trim().length > 0)}
                autoComplete="off"
              />

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div className="autocomplete-dropdown">
                  {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                      Nama tidak ditemukan
                    </div>
                  ) : (
                    filteredUsers.map(([uid, user]) => (
                      <div
                        key={uid}
                        className="autocomplete-item"
                        onClick={() => handleSelectUser(uid, user)}
                      >
                        <div className="autocomplete-name">{user.nama}</div>
                        <div className="autocomplete-meta">
                          {user.prodi} • {user.bidang}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User Info Preview */}
            {selectedUser && (
              <div className="user-info">
                <div className="user-info-row">
                  <span className="user-info-label">UID</span>
                  <span className="user-info-value">{selectedUser.uid}</span>
                </div>
                <div className="user-info-row">
                  <span className="user-info-label">Prodi</span>
                  <span className="user-info-value">{selectedUser.prodi}</span>
                </div>
                <div className="user-info-row">
                  <span className="user-info-label">Bidang</span>
                  <span className="user-info-value">{selectedUser.bidang}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={! selectedUser || submitting}
            >
              {submitting ? "⏳ Menyimpan..." : "✓ Absen Sekarang"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AbsensiScan;