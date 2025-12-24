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
    expiredAt
  };
}

/**
 * Validasi QR session
 */
export async function validateQRSession(sessionId) {
  if (!sessionId) {
    return { valid: false, message: "Session ID tidak valid" };
  }
  
  const sessionRef = ref(db, `qr_session/${sessionId}`);
  const snapshot = await get(sessionRef);
  
  if (!snapshot.exists()) {
    return { valid:  false, message: "Session tidak ditemukan" };
  }
  
  const session = snapshot.val();
  const now = Date.now();
  
  if (! session.aktif) {
    return { valid: false, message: "Session sudah tidak aktif" };
  }
  
  if (now > session.expiredAt) {
    // Auto-deactivate expired session
    await set(sessionRef, { ... session, aktif: false });
    return { valid: false, message: "QR Code sudah expired" };
  }
  
  return { valid: true, message: "Session valid" };
}

/**
 * Deactivate session
 */
export async function deactivateSession(sessionId) {
  const sessionRef = ref(db, `qr_session/${sessionId}`);
  const snapshot = await get(sessionRef);
  
  if (snapshot. exists()) {
    await set(sessionRef, { ... snapshot.val(), aktif: false });
  }
}

/**
 * Clean expired sessions (cleanup utility)
 */
export async function cleanExpiredSessions() {
  const sessionsRef = ref(db, "qr_session");
  const snapshot = await get(sessionsRef);
  
  if (!snapshot.exists()) return;
  
  const sessions = snapshot.val();
  const now = Date.now();
  const updates = {};
  
  Object.entries(sessions).forEach(([sessionId, session]) => {
    if (now > session.expiredAt) {
      updates[`qr_session/${sessionId}`] = null;
    }
  });
  
  if (Object.keys(updates).length > 0) {
    await remove(ref(db, "qr_session"));
  }
}