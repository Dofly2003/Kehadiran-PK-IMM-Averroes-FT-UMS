// src/component/AbsensiForm.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, get, set } from "firebase/database";
import { getTodayPath, formatDateTime } from "../utils/dateHelper";
import "./AbsensiForm.css";

const AbsensiForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const [users, setUsers] = useState({});
  const [inputNama, setInputNama] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ show: false, type: "", message: "" });
  
  useEffect(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 AbsensiForm MOUNTED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Current URL:", window.location.href);
    console.log("Pathname:", window.location.pathname);
    console.log("Search:", window.location.search);
    console.log("Location state:", location);
    console.log("SearchParams:", searchParams. toString());
    console.log("Session ID from searchParams. get('session'):", sessionId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ TEMPORARY: Disable redirect untuk debugging
    if (!sessionId) {
      console.error("❌ NO SESSION ID FOUND!");
      console.warn("⚠️ REDIRECT DISABLED FOR DEBUGGING");
      
      // ⚠️ COMMENT redirect sementara
      // navigate("/scan");
      // return;
    }

    console.log("✅ Loading users...");
    loadUsers();
  }, []);

  const loadUsers = () => {
    const usersRef = ref(db, "users/terdaftar");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const val = snapshot.val();
      console.log("📊 Users loaded:", Object.keys(val || {}).length);
      setUsers(val || {});
      setLoading(false);
    }, (error) => {
      console.error("❌ Error loading users:", error);
      showAlert("danger", "Gagal memuat data users:  " + error.message);
      setLoading(false);
    });

    return unsubscribe;
  };

  const filteredUsers = Object.entries(users).filter(([uid, user]) => {
    if (!inputNama. trim()) return false;
    const searchTerm = inputNama.toLowerCase();
    const nama = (user.nama || "").toLowerCase();
    return nama.includes(searchTerm);
  });

  const handleSelectUser = (uid, user) => {
    console.log("👤 Selected:", user.nama);
    setSelectedUser({ uid, ... user });
    setInputNama(user.nama);
    setShowDropdown(false);
    setAlertMsg({ show: false, type: "", message: "" });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputNama(value);
    setSelectedUser(null);
    setShowDropdown(value. trim().length > 0);
  };

  const showAlert = (type, message) => {
    setAlertMsg({ show: true, type, message });
    setTimeout(() => {
      setAlertMsg({ show: false, type: "", message:  "" });
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
      showAlert("success", `✅ Absensi berhasil!  ${selectedUser.nama} tercatat pada ${waktu}`);

      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (error) {
      console.error("❌ Submit error:", error);
      showAlert("danger", "❌ Gagal menyimpan:  " + error.message);
      setSubmitting(false);
    }
  };

  if (loading) {
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
            <p>⏳ Memuat data users...</p>
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
          <p className="absensi-subtitle">Pilih nama Anda untuk absensi</p>
        </div>

        {/* ✅ Debug Info */}
        <div style={{
          background: sessionId ? "rgba(96,165,250,0.15)" : "rgba(239,68,68,0.15)",
          border: sessionId ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          color: sessionId ? "#60a5fa" : "#ef4444",
          fontSize: "13px"
        }}>
          <strong>🔍 Debug Info:</strong><br />
          <div style={{ fontSize: "11px", fontFamily: "monospace", marginTop: "8px" }}>
            <div>Current URL: {window.location.href}</div>
            <div>Pathname:  {window.location.pathname}</div>
            <div>Search:  {window.location.search}</div>
            <div style={{ 
              marginTop: "8px", 
              padding: "8px", 
              background: "rgba(0,0,0,0.2)", 
              borderRadius: "4px",
              wordBreak: "break-all"
            }}>
              Session ID: {sessionId || "❌ NULL"}
            </div>
          </div>
        </div>

        {/* Alert */}
        {alertMsg. show && (
          <div style={{
            padding: "12px 16px",
            borderRadius:  "8px",
            marginBottom: "16px",
            background: alertMsg.type === "success" ? "rgba(34,197,94,0.15)" :
                       alertMsg.type === "danger" ? "rgba(239,68,68,0.15)" :
                       alertMsg.type === "info" ? "rgba(96,165,250,0.15)" :
                       "rgba(245,158,11,0.15)",
            border: alertMsg.type === "success" ?  "1px solid rgba(34,197,94,0.3)" :
                    alertMsg.type === "danger" ? "1px solid rgba(239,68,68,0.3)" :
                    alertMsg. type === "info" ? "1px solid rgba(96,165,250,0.3)" :
                    "1px solid rgba(245,158,11,0.3)",
            color: alertMsg.type === "success" ? "#22c55e" :
                   alertMsg.type === "danger" ? "#ef4444" :
                   alertMsg.type === "info" ?  "#60a5fa" :
                   "#f59e0b"
          }}>
            {alertMsg.message}
          </div>
        )}

        {/* Form */}
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