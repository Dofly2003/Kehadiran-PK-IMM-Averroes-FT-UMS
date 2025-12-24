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
 * @param {number} durationMinutes - Durasi validitas QR (default: 5 menit)
 */
export async function createQRSession(durationMinutes = 5) {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiredAt = now + (durationMinutes * 60 * 1000);
  
  const sessionRef = ref(db, `qr_session/${sessionId}`);
  
  await set(sessionRef, {
    aktif: true,
    createdAt: now,
    expiredAt: expiredAt
  });
  
  return {
    sessionId,
    expiredAt,
    createdAt: now
  };
}

/**
 * Validasi QR session
 * @param {string} sessionId - ID session dari QR code
 * @returns {object} { valid:  boolean, message:  string, expired: boolean, isSystemError: boolean }
 */
export async function validateQRSession(sessionId) {
  try {
    if (!sessionId) {
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message: "Session ID tidak valid" 
      };
    }
    
    const sessionRef = ref(db, `qr_session/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message:  "QR Code tidak ditemukan atau sudah dihapus" 
      };
    }
    
    const session = snapshot.val();
    const now = Date.now();
    
    if (! session.aktif) {
      return { 
        valid: false, 
        expired: false,
        isSystemError: false,
        message: "QR Code sudah tidak aktif" 
      };
    }
    
    if (now > session.expiredAt) {
      try {
        await set(sessionRef, {... session, aktif: false});
      } catch (updateError) {
        console.warn("Failed to deactivate expired session:", updateError);
      }
      
      const expiredDuration = Math.floor((now - session.expiredAt) / 60000);
      
      return { 
        valid: false, 
        expired: true,
        isSystemError: false,
        message: `QR Code sudah kadaluarsa ${expiredDuration} menit yang lalu.  Minta QR baru dari admin.`,
        expiredAt: session.expiredAt,
        expiredDuration:  expiredDuration
      };
    }
    
    const remainingTime = Math.floor((session.expiredAt - now) / 60000);
    
    return { 
      valid: true, 
      expired: false,
      isSystemError: false,
      message: "QR Code valid",
      session: session,
      remainingTime: remainingTime
    };
    
  } catch (error) {
    console.error("Error validating QR session:", error);
    
    return {
      valid: false,
      expired: false,
      isSystemError: true,
      message: "Tidak dapat terhubung ke server.  Periksa koneksi internet Anda.",
      error: error. message
    };
  }
}

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