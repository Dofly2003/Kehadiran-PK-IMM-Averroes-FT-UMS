// src/components/AbsensiForm.jsx
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
  const [validating, setValidating] = useState(true); // ✅ Track validation state

  // ✅ Validasi session saat mount
  useEffect(() => {
    console.log("📋 AbsensiForm mounted");
    console.log("🔍 Session ID dari URL:", sessionId);
    validateSession();
  }, [sessionId]);

  // ✅ Fetch users setelah session valid
  useEffect(() => {
    if (! sessionValid) {
      console.log("⚠️ Session not valid, skipping user fetch");
      return;
    }

    console.log("✅ Session valid, fetching users.. .");

    const usersRef = ref(db, "users/terdaftar");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      console.log("📊 Users loaded:", val);
      setUsers(val || {});
      setLoading(false);
    }, (error) => {
      console.error("❌ Error fetching users:", error);
      showAlert("danger", "Gagal memuat data users");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionValid]);

  const validateSession = async () => {
    console.log("🔍 Starting session validation...");
    
    if (!sessionId) {
      console.error("❌ No session ID provided");
      showAlert("danger", "Session tidak valid.  Scan QR Code terlebih dahulu.");
      setValidating(false);
      
      setTimeout(() => {
        console.log("🔄 Redirecting to /scan");
        navigate("/scan");
      }, 2000);
      return;
    }

    try {
      console.log("🔍 Validating session:", sessionId);
      const validation = await validateQRSession(sessionId);
      console.log("📊 Validation result:", validation);

      if (! validation.valid) {
        console.error("❌ Session invalid:", validation.message);
        showAlert("danger", validation.message);
        setValidating(false);
        
        setTimeout(() => {
          console. log("🔄 Redirecting to /scan");
          navigate("/scan");
        }, 2000);
        return;
      }

      console.log("✅ Session valid!");
      setSessionValid(true);
      setValidating(false);

    } catch (error) {
      console.error("❌ Validation error:", error);
      showAlert("danger", "Gagal memvalidasi session:  " + error.message);
      setValidating(false);
      
      setTimeout(() => {
        navigate("/scan");
      }, 2000);
    }
  };

  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (!inputNama. trim()) return false;
    const searchTerm = inputNama.toLowerCase();
    const nama = (user.nama || "").toLowerCase();
    return nama.includes(searchTerm);
  });

  const handleSelectUser = (uid, user) => {
    console.log("👤 User selected:", user);
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
    console.log(`🔔 Alert [${type}]: `, message);
    setAlert({ show: true, type, message });
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

    console.log("📝 Submitting absensi for:", selectedUser);
    setSubmitting(true);

    try {
      const { tahun, bulan, minggu, tanggal } = getTodayPath();
      const absensiPath = `absensi/${tahun}/${bulan}/${minggu}/${tanggal}/${selectedUser.uid}`;
      
      console.log("📍 Absensi path:", absensiPath);
      
      const absensiRef = ref(db, absensiPath);

      // Cek duplikasi
      const snapshot = await get(absensiRef);
      
      if (snapshot.exists()) {
        const existingData = snapshot.val();
        console.log("⚠️ Already absent today:", existingData);
        showAlert(
          "info",
          `ℹ️ ${selectedUser.nama} sudah absen hari ini pada ${existingData.waktu}`
        );
        setSubmitting(false);
        return;
      }

      // Simpan absensi
      const waktu = formatDateTime(new Date());
      const absensiData = {
        nama: selectedUser.nama,
        uid: selectedUser.uid,
        waktu: waktu
      };

      console.log("💾 Saving absensi:", absensiData);
      await set(absensiRef, absensiData);

      console.log("✅ Absensi saved successfully!");
      showAlert(
        "success",
        `✅ Absensi berhasil!  ${selectedUser.nama} tercatat pada ${waktu}`
      );

      // Redirect setelah 3 detik
      setTimeout(() => {
        console.log("🏠 Redirecting to home...");
        navigate("/");
      }, 3000);

    } catch (error) {
      console.error("❌ Error submitting absensi:", error);
      showAlert("danger", "❌ Gagal menyimpan absensi.  Coba lagi.");
      setSubmitting(false);
    }
  };

  // ✅ Show loading saat validasi
  if (validating) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div className="loading-message">
            <div className="spinner"></div>
            <p>⏳ Memvalidasi session...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Show error jika session invalid
  if (!sessionValid) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div className="error-message">
            <span style={{ fontSize: "48px", marginBottom: "16px" }}>❌</span>
            <p>Session tidak valid</p>
            <p style={{ fontSize: "14px", color: "#a7b3e6" }}>
              Mengarahkan ke halaman scan... 
            </p>
          </div>
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

        {/* ✅ Debug Info */}
        <div style={{
          background: "#f7fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "20px",
          fontSize: "12px",
          fontFamily: "monospace",
          color: "#1a202c"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>🔍 Debug Info: </div>
          <div>Session ID: {sessionId ?  sessionId. substring(0, 25) + "..." : "None"}</div>
          <div>Session Valid: {sessionValid ? "✅ Yes" : "❌ No"}</div>
          <div>Total Users: {Object.keys(users).length}</div>
          <div>Selected User: {selectedUser ? selectedUser.nama : "None"}</div>
        </div>

        {alert.show && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>⏳ Memuat data... </p>
          </div>
        )}

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
                disabled={submitting}
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
                  <span className="user-info-value">{selectedUser. bidang}</span>
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