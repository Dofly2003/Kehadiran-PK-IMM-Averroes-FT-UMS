// src/components/AbsensiForm.js
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, get, set } from "firebase/database";
import { validateQRSession } from "../utils/qrHelper";
import { getTodayPath, formatDateTime } from "../utils/dateHelper";
import "./AbsensiForm.css";

const AbsensiForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [users, setUsers] = useState({});
  const [inputNama, setInputNama] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [sessionValid, setSessionValid] = useState(false);

  // Validasi session saat mount
  useEffect(() => {
    validateSession();
  }, [sessionId]);

  // Fetch users
  useEffect(() => {
    if (! sessionValid) return;

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
  }, [sessionValid]);

  const validateSession = async () => {
    if (!sessionId) {
      showAlert("danger", "Session tidak valid.  Scan QR Code terlebih dahulu.");
      setTimeout(() => navigate("/scan"), 2000);
      return;
    }

    const validation = await validateQRSession(sessionId);

    if (! validation.valid) {
      showAlert("danger", validation.message);
      setTimeout(() => navigate("/scan"), 2000);
      return;
    }

    setSessionValid(true);
  };

  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (!inputNama.trim()) return false;
    const searchTerm = inputNama.toLowerCase();
    const nama = (user.nama || "").toLowerCase();
    return nama.includes(searchTerm);
  });

  const handleSelectUser = (uid, user) => {
    setSelectedUser({ uid, ... user });
    setInputNama(user.nama);
    setShowDropdown(false);
    setAlert({ show: false, type: "", message: "" });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputNama(value);
    setSelectedUser(null);
    setShowDropdown(value. trim().length > 0);
  };

  const showAlert = (type, message) => {
    setAlert({ show:  true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 5000);
  };

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

      // Cek duplikasi
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

      // Simpan absensi
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
      setTimeout(() => {
        navigate("/scan");
      }, 3000);

    } catch (error) {
      console.error("Error submitting absensi:", error);
      showAlert("danger", "❌ Gagal menyimpan absensi.  Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (! sessionValid) {
    return (
      <div className="absensi-page">
        <div className="absensi-container">
          <div className="loading-message">⏳ Memvalidasi session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absensi-form-page">
      <div className="absensi-container">
        <div className="absensi-header">
          <span className="absensi-icon">✍️</span>
          <h1 className="absensi-title">Form Absensi</h1>
          <p className="absensi-subtitle">Pilih nama Anda untuk melakukan absensi</p>
        </div>

        {alert.show && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {loading && <div className="loading">⏳ Memuat data...</div>}

        {!loading && (
          <form onSubmit={handleSubmit}>
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

              {showDropdown && (
                <div className="autocomplete-dropdown">
                  {filteredUsers.length === 0 ? (
                    <div className="empty-state">Nama tidak ditemukan</div>
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

            <button
              type="submit"
              className="btn btn-primary"
              disabled={! selectedUser || submitting}
            >
              {submitting ? "⏳ Menyimpan..." : "✓ Absen Sekarang"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/scan")}
              disabled={submitting}
            >
              ← Scan Ulang
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AbsensiForm;