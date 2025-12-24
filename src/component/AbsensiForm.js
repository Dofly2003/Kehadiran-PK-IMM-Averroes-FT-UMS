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

  // Validasi session saat mount
  useEffect(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 AbsensiForm Loaded");
    console.log("🔍 Full URL:", window.location.href);
    console.log("🔍 Session ID from URL:", sessionId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    validateSession();
  }, [sessionId]);

  // Fetch users setelah session valid
  useEffect(() => {
    if (! sessionValid) {
      console.log("⚠️ Session not valid, skipping user fetch");
      return;
    }

    console.log("✅ Session valid, loading users...");

    const usersRef = ref(db, "users/terdaftar");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      console.log("📊 Users loaded:", Object.keys(val || {}).length, "users");
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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 Starting session validation...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (!sessionId) {
      console.error("❌ No session ID in URL");
      showAlert("danger", "Session tidak valid.  Scan QR Code terlebih dahulu.");
      setValidating(false);
      
      setTimeout(() => {
        navigate("/scan");
      }, 2000);
      return;
    }

    try {
      console.log("🔍 Calling validateQRSession()...");
      console.log("Session ID:", sessionId);
      
      // ✅ Call validation function
      const validation = await validateQRSession(sessionId);
      
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📊 Validation Result:");
      console.log(JSON.stringify(validation, null, 2));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // ✅ Handle system error
      if (validation.isSystemError) {
        console.error("❌ System error:", validation.message);
        showAlert("danger", validation.message);
        setValidating(false);
        return;
      }

      // ✅ Handle expired session
      if (validation.expired) {
        console.warn("⚠️ Session expired:", validation.message);
        showAlert("warning", validation.message);
        setValidating(false);
        
        setTimeout(() => {
          navigate("/scan");
        }, 3000);
        return;
      }

      // ✅ Handle invalid session
      if (! validation.valid) {
        console.error("❌ Session invalid:", validation.message);
        showAlert("danger", validation.message);
        setValidating(false);
        
        setTimeout(() => {
          navigate("/scan");
        }, 2000);
        return;
      }

      // ✅ Session valid! 
      console.log("✅ Session valid!");
      console.log("Remaining time:", validation.remainingTime, "minutes");
      
      setSessionValid(true);
      setSessionInfo(validation);
      setValidating(false);

    } catch (error) {
      console.error("❌ Validation error:", error);
      console.error("Error stack:", error.stack);
      showAlert("danger", "Gagal memvalidasi session:  " + error.message);
      setValidating(false);
      
      setTimeout(() => {
        navigate("/scan");
      }, 2000);
    }
  };

  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (!inputNama.trim()) return false;
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
        waktu:  waktu
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

  // ✅ Loading state
  if (validating) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div style={{
            textAlign: "center",
            padding: "40px 20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.1)",
              borderTopColor: "#60a5fa",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}></div>
            <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
              ⏳ Memvalidasi session...
            </p>
            <p style={{ 
              fontSize: "12px", 
              color: "#a7b3e6", 
              fontFamily: "monospace",
              wordBreak: "break-all",
              padding: "0 20px"
            }}>
              {sessionId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (! sessionValid) {
    return (
      <div className="absensi-form-page">
        <div className="absensi-container">
          <div style={{
            textAlign: "center",
            padding: "40px 20px"
          }}>
            <span style={{ fontSize: "48px", marginBottom: "16px", display: "block" }}>❌</span>
            <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
              Session tidak valid
            </p>
            <p style={{ fontSize: "14px", color: "#a7b3e6" }}>
              Mengarahkan ke halaman scan... 
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main form
  return (
    <div className="absensi-form-page">
      <div className="absensi-container">
        <div className="absensi-header">
          <span className="absensi-icon">✍️</span>
          <h1 className="absensi-title">Form Absensi</h1>
          <p className="absensi-subtitle">Pilih nama Anda untuk melakukan absensi</p>
        </div>

        {/* ✅ Session Info */}
        {sessionInfo && (
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#22c55e"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>✅ QR Code Valid</div>
            <div>Waktu tersisa: {sessionInfo.remainingTime} menit</div>
          </div>
        )}

        {/* Alert */}
        {alert.show && (
          <div className={`alert alert-${alert.type}`} style={{
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
          <div style={{ textAlign: "center", padding: "20px" }}>
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

      {/* ✅ Add keyframe animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AbsensiForm;