// src/components/AbsensiForm. jsx
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
  const [validating, setValidating] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  // ✅ SKIP VALIDATION MODE (untuk debugging)
  const SKIP_VALIDATION = true; // ⚠️ Set ke false setelah fix

  useEffect(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 AbsensiForm Loaded");
    console.log("🔍 Session ID:", sessionId);
    console.log("⚠️ SKIP_VALIDATION:", SKIP_VALIDATION);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    validateSession();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionValid) {
      console.log("⚠️ Session not valid, skipping user fetch");
      return;
    }

    console.log("✅ Loading users...");
    const usersRef = ref(db, "users/terdaftar");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      console.log("📊 Users loaded:", Object.keys(val || {}).length);
      setUsers(val || {});
      setLoading(false);
    }, (error) => {
      console.error("❌ Error fetching users:", error);
      showAlert("danger", "Gagal memuat data users");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionValid]);

// Ganti bagian validateSession dengan ini: 

const validateSession = async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔍 VALIDATE SESSION CALLED");
  console.log("Session ID:", sessionId);
  console.log("SKIP_VALIDATION:", SKIP_VALIDATION);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (! sessionId) {
    console.error("❌ No session ID");
    alert("ERROR: No session ID in URL!");
    showAlert("danger", "Session tidak valid");
    setValidating(false);
    setTimeout(() => navigate("/scan"), 2000);
    return;
  }

  try {
    // ✅ FORCE SKIP VALIDATION
    if (SKIP_VALIDATION) {
      console.warn("⚠️⚠️⚠️ VALIDATION SKIPPED ⚠️⚠️⚠️");
      alert("DEBUG: Validation skipped!\nSession ID: " + sessionId. substring(0, 20));
      
      setSessionValid(true);
      setSessionInfo({
        valid: true,
        remainingTime: 30,
        message: "DEBUG: Validation bypassed"
      });
      setValidating(false);
      return; // ✅ STOP HERE
    }

    // Normal validation (tidak akan sampai sini jika SKIP_VALIDATION = true)
    console.log("🔍 Calling validateQRSession().. .");
    const validation = await validateQRSession(sessionId);
    
    console.log("📊 Result:", validation);

    if (validation.isSystemError) {
      showAlert("danger", validation.message);
      setValidating(false);
      return;
    }

    if (validation.expired) {
      showAlert("warning", validation.message);
      setValidating(false);
      setTimeout(() => navigate("/scan"), 3000);
      return;
    }

    if (! validation.valid) {
      showAlert("danger", validation.message);
      setValidating(false);
      setTimeout(() => navigate("/scan"), 2000);
      return;
    }

    setSessionValid(true);
    setSessionInfo(validation);
    setValidating(false);

  } catch (error) {
    console.error("❌ Error:", error);
    alert("EXCEPTION: " + error.message);
    showAlert("danger", "Error:   " + error.message);
    setValidating(false);
    setTimeout(() => navigate("/scan"), 2000);
  }
};

  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (! inputNama. trim()) return false;
    const searchTerm = inputNama.toLowerCase();
    const nama = (user.nama || "").toLowerCase();
    return nama.includes(searchTerm);
  });

  const handleSelectUser = (uid, user) => {
    console.log("👤 Selected:", user.nama);
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
      showAlert("danger", "⚠️ Pilih nama dari daftar!");
      return;
    }

    console.log("📝 Submitting:", selectedUser.nama);
    setSubmitting(true);

    try {
      const { tahun, bulan, minggu, tanggal } = getTodayPath();
      const absensiPath = `absensi/${tahun}/${bulan}/${minggu}/${tanggal}/${selectedUser.uid}`;
      
      console.log("📍 Path:", absensiPath);
      
      const absensiRef = ref(db, absensiPath);
      const snapshot = await get(absensiRef);
      
      if (snapshot.exists()) {
        const existingData = snapshot.val();
        showAlert("info", `ℹ️ ${selectedUser.nama} sudah absen pada ${existingData.waktu}`);
        setSubmitting(false);
        return;
      }

      const waktu = formatDateTime(new Date());
      const absensiData = {
        nama: selectedUser.nama,
        uid: selectedUser.uid,
        waktu:  waktu
      };

      console.log("💾 Saving:", absensiData);
      await set(absensiRef, absensiData);

      console.log("✅ Saved!");
      showAlert("success", `✅ Absensi berhasil! ${selectedUser.nama} tercatat pada ${waktu}`);

      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (error) {
      console.error("❌ Submit error:", error);
      showAlert("danger", "❌ Gagal menyimpan");
      setSubmitting(false);
    }
  };

  // Loading
  if (validating) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.1)",
              borderTopColor: "#60a5fa",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}></div>
            <p>⏳ Memvalidasi session...</p>
            {SKIP_VALIDATION && (
              <p style={{ color: "#f59e0b", fontSize: "12px", marginTop: "8px" }}>
                ⚠️ DEBUG MODE:  Validation bypassed
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (! sessionValid) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div style={{ textAlign: "center", padding:  "40px 20px" }}>
            <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>❌</span>
            <p style={{ fontSize: "18px", fontWeight: "600" }}>Session tidak valid</p>
            <p style={{ fontSize: "14px", color: "#a7b3e6" }}>Mengarahkan ke scan... </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="absensi-form-page">
      <div className="absensi-container">
        <div className="absensi-header">
          <span className="absensi-icon">✍️</span>
          <h1 className="absensi-title">Form Absensi</h1>
          <p className="absensi-subtitle">Pilih nama Anda untuk absensi</p>
        </div>

        {/* Debug Warning */}
        {SKIP_VALIDATION && (
          <div style={{
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#f59e0b",
            fontSize: "13px"
          }}>
            ⚠️ <strong>DEBUG MODE: </strong> Validation is bypassed
          </div>
        )}

        {/* Session Info */}
        {sessionInfo && (
          <div style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#22c55e",
            fontSize:  "13px"
          }}>
            <div style={{ fontWeight: "bold" }}>✅ Session Valid</div>
            <div>Waktu tersisa: {sessionInfo.remainingTime} menit</div>
          </div>
        )}

        {/* Alert */}
        {alert.show && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: alert.type === "success" ? "rgba(34,197,94,0.15)" :
                       alert.type === "danger" ? "rgba(239,68,68,0.15)" :
                       alert.type === "warning" ? "rgba(245,158,11,0.15)" :
                       "rgba(96,165,250,0.15)",
            border: alert.type === "success" ? "1px solid rgba(34,197,94,0.3)" :
                    alert.type === "danger" ?  "1px solid rgba(239,68,68,0.3)" :
                    alert.type === "warning" ? "1px solid rgba(245,158,11,0.3)" :
                    "1px solid rgba(96,165,250,0.3)",
            color: alert.type === "success" ? "#22c55e" : 
                   alert.type === "danger" ?  "#ef4444" :
                   alert.type === "warning" ? "#f59e0b" : 
                   "#60a5fa"
          }}>
            {alert.message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding:  "20px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "#60a5fa",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px"
            }}></div>
            <p>⏳ Memuat data... </p>
          </div>
        )}

        {/* Form */}
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AbsensiForm;