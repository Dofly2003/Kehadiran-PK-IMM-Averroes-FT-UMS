
export function getWeekOfMonth(day) {
  const weekNumber = Math.floor((day - 1) / 7) + 1;
  return `minggu-${weekNumber}`;
}

/**
 * Format Date object ke string "YYYY-MM-DD HH:mm:ss"
 */
export function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date. getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get path components untuk absensi hari ini
 */
export function getTodayPath() {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, "0");
  const tanggal = String(now.getDate()).padStart(2, "0");
  const minggu = getWeekOfMonth(now. getDate());
  
  return { tahun, bulan, minggu, tanggal };
}