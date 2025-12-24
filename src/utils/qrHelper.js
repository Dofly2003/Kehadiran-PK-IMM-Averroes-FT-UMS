// src/utils/qrHelper.js
import { ref, set, get, remove } from "firebase/database";
import { db } from "../firebase";

/**
 * Generate unique session ID
 */
export function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `qr_${timestamp}_${random}`;
}

/**
 * Create QR session di Firebase
 */
export async function createQRSession(durationMinutes = 30) { // ✅ Ubah default jadi 30 menit
  try {
    const sessionId = generateSessionId();
    const now = Date.now();
    const expiredAt = now + (durationMinutes * 60 * 1000);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💾 Creating QR Session");
    console.log("Session ID:", sessionId);
    console.log("Created at:", new Date(now).toLocaleString());
    console.log("Expires at:", new Date(expiredAt).toLocaleString());
    console.log("Duration:", durationMinutes, "minutes");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const sessionData = {
      aktif: true,
      createdAt: now,
      expiredAt: expiredAt
    };
    
    const sessionRef = ref(db, `qr_session/${sessionId}`);
    
    console.log("📍 Firebase path:", `qr_session/${sessionId}`);
    console.log("📦 Data to save:", sessionData);
    
    // ✅ Save to Firebase
    await set(sessionRef, sessionData);
    
    console.log("✅ Data saved to Firebase");
    
    // ✅ Verify save
    console.log("🔍 Verifying save.. .");
    const verifySnapshot = await get(sessionRef);
    
    if (verifySnapshot.exists()) {
      const savedData = verifySnapshot.val();
      console.log("✅ Verification successful!");
      console.log("Saved data:", savedData);
    } else {
      console.error("❌ Verification failed!  Data not found in Firebase");
      throw new Error("Failed to save session to Firebase");
    }
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return {
      sessionId,
      expiredAt,
      createdAt: now
    };
    
  } catch (error) {
    console.error("❌ Error creating QR session:", error);
    console.error("Error details:", error. message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

/**
 * Validasi QR session
 */
export async function validateQRSession(sessionId) {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 Validating QR Session");
    console.log("Session ID:", sessionId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!sessionId) {
      console.error("❌ No session ID provided");
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message: "Session ID tidak valid" 
      };
    }
    
    const sessionRef = ref(db, `qr_session/${sessionId}`);
    console.log("📍 Checking path:", `qr_session/${sessionId}`);
    
    const snapshot = await get(sessionRef);
    console.log("📊 Snapshot exists:", snapshot.exists());
    
    if (!snapshot.exists()) {
      console.error("❌ Session not found in Firebase");
      console.log("💡 Possible reasons:");
      console.log("   1. QR session belum/tidak tersimpan");
      console.log("   2. Session ID salah");
      console.log("   3. Firebase rules memblokir");
      
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message: "QR Code tidak ditemukan.  Generate QR baru dari admin." 
      };
    }
    
    const session = snapshot.val();
    console.log("📦 Session data:", session);
    
    const now = Date.now();
    console.log("🕐 Current time:", now, "(" + new Date(now).toLocaleString() + ")");
    console.log("🕐 Expired at:", session.expiredAt, "(" + new Date(session.expiredAt).toLocaleString() + ")");
    
    if (! session.aktif) {
      console.warn("⚠️ Session not active");
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message: "QR Code sudah tidak aktif" 
      };
    }
    
    if (now > session.expiredAt) {
      const expiredDuration = Math.floor((now - session.expiredAt) / 60000);
      console.warn("⚠️ Session expired");
      console.log("Expired", expiredDuration, "minutes ago");
      
      // Deactivate expired session
      try {
        await set(sessionRef, {... session, aktif: false});
        console.log("✅ Session marked as inactive");
      } catch (updateError) {
        console.warn("Failed to deactivate:", updateError);
      }
      
      return { 
        valid: false, 
        expired: true,
        isSystemError: false,
        message: `QR Code sudah kadaluarsa ${expiredDuration} menit yang lalu. Minta QR baru dari admin.`,
        expiredAt: session.expiredAt,
        expiredDuration: expiredDuration
      };
    }
    
    const remainingTime = Math.floor((session.expiredAt - now) / 60000);
    console.log("✅ Session valid!");
    console.log("⏱️ Remaining time:", remainingTime, "minutes");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return { 
      valid: true, 
      expired: false,
      isSystemError: false,
      message: "QR Code valid",
      session: session,
      remainingTime: remainingTime
    };
    
  } catch (error) {
    console.error("❌ Validation error:", error);
    console.error("Error message:", error.message);
    console.error("Stack trace:", error. stack);
    
    return {
      valid: false,
      expired: false,
      isSystemError: true,
      message: "Tidak dapat terhubung ke server.  Periksa koneksi internet.",
      error: error.message
    };
  }
}

// ...  fungsi lainnya tetap sama

/**
 * Deactivate session
 * @param {string} sessionId - ID session yang akan dinonaktifkan
 */
export async function deactivateSession(sessionId) {
  try {
    const sessionRef = ref(db, `qr_session/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (snapshot.exists()) {
      await set(sessionRef, {... snapshot.val(), aktif: false});
      return {success: true, message: "Session berhasil dinonaktifkan"};
    }
    
    return {success: false, message:  "Session tidak ditemukan"};
    
  } catch (error) {
    console.error("Error deactivating session:", error);
    return { 
      success: false, 
      message: "Gagal menonaktifkan session",
      error: error.message 
    };
  }
}

/**
 * Clean expired sessions
 */
export async function cleanExpiredSessions() {
  try {
    const sessionsRef = ref(db, "qr_session");
    const snapshot = await get(sessionsRef);
    
    if (! snapshot.exists()) {
      return { 
        success: true, 
        message: "Tidak ada session untuk dibersihkan",
        cleaned: 0 
      };
    }
    
    const sessions = snapshot.val();
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of Object. entries(sessions)) {
      if (now > session.expiredAt) {
        const sessionRef = ref(db, `qr_session/${sessionId}`);
        await remove(sessionRef);
        cleanedCount++;
      }
    }
    
    return {
      success: true,
      message:  `Berhasil membersihkan ${cleanedCount} session yang expired`,
      cleaned: cleanedCount
    };
    
  } catch (error) {
    console.error("Error cleaning expired sessions:", error);
    return {
      success: false,
      message: "Gagal membersihkan session",
      error: error.message
    };
  }
}

/**
 * Get session info
 */
export async function getSessionInfo(sessionId) {
  try {
    const sessionRef = ref(db, `qr_session/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      return { 
        exists: false, 
        message: "Session tidak ditemukan" 
      };
    }
    
    const session = snapshot. val();
    const now = Date.now();
    const isExpired = now > session.expiredAt;
    const remainingTime = isExpired ? 0 : Math.floor((session.expiredAt - now) / 60000);
    
    return {
      exists: true,
      sessionId:  sessionId,
      aktif: session.aktif,
      createdAt: new Date(session.createdAt).toLocaleString('id-ID'),
      expiredAt: new Date(session.expiredAt).toLocaleString('id-ID'),
      isExpired: isExpired,
      remainingMinutes: remainingTime,
      session: session
    };
    
  } catch (error) {
    console.error("Error getting session info:", error);
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Get all active sessions
 */
export async function getAllActiveSessions() {
  try {
    const sessionsRef = ref(db, "qr_session");
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      return { 
        success: true, 
        sessions: [],
        total: 0 
      };
    }
    
    const sessions = snapshot.val();
    const now = Date. now();
    const activeSessions = [];
    
    Object.entries(sessions).forEach(([sessionId, session]) => {
      if (session.aktif && now <= session.expiredAt) {
        activeSessions.push({
          sessionId,
          ...session,
          remainingMinutes: Math.floor((session.expiredAt - now) / 60000)
        });
      }
    });
    
    return {
      success:  true,
      sessions: activeSessions,
      total: activeSessions.length
    };
    
  } catch (error) {
    console.error("Error getting active sessions:", error);
    return {
      success: false,
      sessions: [],
      error: error.message
    };
  }
}