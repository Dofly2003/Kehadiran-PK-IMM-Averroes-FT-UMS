// Data Storage Keys
const ANGGOTA_KEY = 'pk_imm_anggota';
const KEHADIRAN_KEY = 'pk_imm_kehadiran';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load initial data
    loadAnggotaList();
    updateStats();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup NIM lookup for attendance
    document.getElementById('nimAbsensi').addEventListener('input', function() {
        const nim = this.value.trim();
        const namaField = document.getElementById('namaAbsensi');
        
        if (nim) {
            const anggota = getAnggotaByNim(nim);
            if (anggota) {
                namaField.value = anggota.nama;
                namaField.style.color = '#28a745';
            } else {
                namaField.value = 'Anggota tidak ditemukan - Silakan registrasi terlebih dahulu';
                namaField.style.color = '#dc3545';
            }
        } else {
            namaField.value = '';
            namaField.style.color = '#6c757d';
        }
    });
}

function setupFormHandlers() {
    // Registration form handler
    document.getElementById('formRegistrasi').addEventListener('submit', function(e) {
        e.preventDefault();
        registrasiAnggota();
    });
}

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.closest('.tab-btn').classList.add('active');
    
    // Load data based on active tab
    if (tabName === 'anggota') {
        loadAnggotaList();
    } else if (tabName === 'riwayat') {
        document.getElementById('daftarRiwayat').innerHTML = '<p class="empty-state"><i class="fas fa-search"></i><br>Masukkan NIM/ID untuk melihat riwayat kehadiran</p>';
    }
}

// Local Storage Functions
function getAnggotaData() {
    const data = localStorage.getItem(ANGGOTA_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAnggotaData(data) {
    localStorage.setItem(ANGGOTA_KEY, JSON.stringify(data));
}

function getKehadiranData() {
    const data = localStorage.getItem(KEHADIRAN_KEY);
    return data ? JSON.parse(data) : [];
}

function saveKehadiranData(data) {
    localStorage.setItem(KEHADIRAN_KEY, JSON.stringify(data));
}

function getAnggotaByNim(nim) {
    const anggota = getAnggotaData();
    return anggota.find(a => a.nim === nim);
}

// Registration Functions
function registrasiAnggota() {
    const nim = document.getElementById('nimReg').value.trim();
    const nama = document.getElementById('namaReg').value.trim();
    const fakultas = document.getElementById('fakultasReg').value;
    const prodi = document.getElementById('prodiReg').value.trim();
    const angkatan = document.getElementById('angkatanReg').value;
    const kontak = document.getElementById('kontakReg').value.trim();
    
    if (!nim || !nama || !fakultas || !prodi || !angkatan) {
        showStatus('statusRegistrasi', 'Data tidak lengkap! Mohon isi semua field yang wajib.', 'error');
        return;
    }
    
    const anggotaData = getAnggotaData();
    
    // Check if NIM already exists
    if (anggotaData.find(a => a.nim === nim)) {
        showStatus('statusRegistrasi', 'NIM/ID sudah terdaftar! Gunakan NIM/ID yang berbeda.', 'error');
        return;
    }
    
    // Add new member
    const newAnggota = {
        nim: nim,
        nama: nama,
        fakultas: fakultas,
        prodi: prodi,
        angkatan: parseInt(angkatan),
        kontak: kontak,
        tanggalDaftar: new Date().toISOString(),
        totalKehadiran: 0
    };
    
    anggotaData.push(newAnggota);
    saveAnggotaData(anggotaData);
    
    // Reset form
    document.getElementById('formRegistrasi').reset();
    
    // Show success message
    showStatus('statusRegistrasi', `Registrasi berhasil! ${nama} telah terdaftar dengan NIM/ID: ${nim}`, 'success');
    
    // Update stats
    updateStats();
    
    // If we're on the anggota tab, refresh the list
    if (document.getElementById('anggota').classList.contains('active')) {
        loadAnggotaList();
    }
}

// Attendance Functions
function absenMasuk() {
    const nim = document.getElementById('nimAbsensi').value.trim();
    const jenisKegiatan = document.getElementById('jenisKegiatan').value;
    
    if (!nim) {
        showStatus('statusAbsensi', 'Mohon masukkan NIM/ID!', 'error');
        return;
    }
    
    if (!jenisKegiatan) {
        showStatus('statusAbsensi', 'Mohon pilih jenis kegiatan!', 'error');
        return;
    }
    
    const anggota = getAnggotaByNim(nim);
    if (!anggota) {
        showStatus('statusAbsensi', 'Anggota tidak ditemukan! Silakan registrasi terlebih dahulu.', 'error');
        return;
    }
    
    const kehadiranData = getKehadiranData();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today for this activity
    const existingRecord = kehadiranData.find(k => 
        k.nim === nim && 
        k.tanggal === today && 
        k.jenisKegiatan === jenisKegiatan &&
        k.waktuMasuk && !k.waktuKeluar
    );
    
    if (existingRecord) {
        showStatus('statusAbsensi', 'Anda sudah absen masuk untuk kegiatan ini hari ini!', 'error');
        return;
    }
    
    // Create new attendance record
    const waktuSekarang = new Date();
    const newKehadiran = {
        id: Date.now(),
        nim: nim,
        nama: anggota.nama,
        jenisKegiatan: jenisKegiatan,
        tanggal: today,
        waktuMasuk: waktuSekarang.toLocaleTimeString('id-ID'),
        waktuKeluar: null,
        durasi: null,
        status: 'Masuk'
    };
    
    kehadiranData.push(newKehadiran);
    saveKehadiranData(kehadiranData);
    
    // Update member's total attendance
    const anggotaData = getAnggotaData();
    const memberIndex = anggotaData.findIndex(a => a.nim === nim);
    if (memberIndex !== -1) {
        anggotaData[memberIndex].totalKehadiran = (anggotaData[memberIndex].totalKehadiran || 0) + 1;
        saveAnggotaData(anggotaData);
    }
    
    showStatus('statusAbsensi', `Absen masuk berhasil! ${anggota.nama} - ${jenisKegiatan} pada ${waktuSekarang.toLocaleTimeString('id-ID')}`, 'success');
    
    // Clear form
    document.getElementById('nimAbsensi').value = '';
    document.getElementById('namaAbsensi').value = '';
    document.getElementById('jenisKegiatan').value = '';
}

function absenKeluar() {
    const nim = document.getElementById('nimAbsensi').value.trim();
    const jenisKegiatan = document.getElementById('jenisKegiatan').value;
    
    if (!nim) {
        showStatus('statusAbsensi', 'Mohon masukkan NIM/ID!', 'error');
        return;
    }
    
    if (!jenisKegiatan) {
        showStatus('statusAbsensi', 'Mohon pilih jenis kegiatan!', 'error');
        return;
    }
    
    const anggota = getAnggotaByNim(nim);
    if (!anggota) {
        showStatus('statusAbsensi', 'Anggota tidak ditemukan!', 'error');
        return;
    }
    
    const kehadiranData = getKehadiranData();
    const today = new Date().toISOString().split('T')[0];
    
    // Find existing check-in record for today
    const recordIndex = kehadiranData.findIndex(k => 
        k.nim === nim && 
        k.tanggal === today && 
        k.jenisKegiatan === jenisKegiatan &&
        k.waktuMasuk && !k.waktuKeluar
    );
    
    if (recordIndex === -1) {
        showStatus('statusAbsensi', 'Tidak ada record absen masuk untuk hari ini! Silakan absen masuk terlebih dahulu.', 'error');
        return;
    }
    
    // Update record with check-out time
    const waktuSekarang = new Date();
    const record = kehadiranData[recordIndex];
    
    record.waktuKeluar = waktuSekarang.toLocaleTimeString('id-ID');
    record.status = 'Selesai';
    
    // Calculate duration
    const masuk = new Date(`${today} ${record.waktuMasuk}`);
    const keluar = waktuSekarang;
    const durasi = Math.round((keluar - masuk) / 1000 / 60); // in minutes
    record.durasi = `${Math.floor(durasi / 60)} jam ${durasi % 60} menit`;
    
    saveKehadiranData(kehadiranData);
    
    showStatus('statusAbsensi', `Absen keluar berhasil! ${anggota.nama} - ${jenisKegiatan} pada ${waktuSekarang.toLocaleTimeString('id-ID')}. Durasi: ${record.durasi}`, 'success');
    
    // Clear form
    document.getElementById('nimAbsensi').value = '';
    document.getElementById('namaAbsensi').value = '';
    document.getElementById('jenisKegiatan').value = '';
}

// History Functions
function tampilkanRiwayat() {
    const nim = document.getElementById('nimRiwayat').value.trim();
    
    if (!nim) {
        showStatus('statusRiwayat', 'Mohon masukkan NIM/ID!', 'error');
        return;
    }
    
    const anggota = getAnggotaByNim(nim);
    if (!anggota) {
        document.getElementById('daftarRiwayat').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-times"></i>
                <p>Anggota dengan NIM/ID "${nim}" tidak ditemukan</p>
                <small>Pastikan NIM/ID sudah terdaftar</small>
            </div>
        `;
        return;
    }
    
    const kehadiranData = getKehadiranData();
    const userKehadiran = kehadiranData
        .filter(k => k.nim === nim)
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const container = document.getElementById('daftarRiwayat');
    
    if (userKehadiran.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Belum ada riwayat kehadiran</p>
                <small>untuk ${anggota.nama}</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4 style="margin-bottom: 20px; color: #667eea;">
            <i class="fas fa-user"></i> Riwayat Kehadiran: ${anggota.nama}
        </h4>
        ${userKehadiran.map(k => `
            <div class="riwayat-item">
                <h4>${k.jenisKegiatan}</h4>
                <p><i class="fas fa-calendar"></i> <strong>Tanggal:</strong> ${formatTanggal(k.tanggal)}</p>
                <p><i class="fas fa-sign-in-alt"></i> <strong>Masuk:</strong> ${k.waktuMasuk}</p>
                ${k.waktuKeluar ? `<p><i class="fas fa-sign-out-alt"></i> <strong>Keluar:</strong> ${k.waktuKeluar}</p>` : ''}
                ${k.durasi ? `<p><i class="fas fa-clock"></i> <strong>Durasi:</strong> ${k.durasi}</p>` : ''}
                <p><i class="fas fa-info-circle"></i> <strong>Status:</strong> 
                    <span style="color: ${k.status === 'Selesai' ? '#28a745' : '#ffc107'}">${k.status}</span>
                </p>
            </div>
        `).join('')}
        <div style="margin-top: 20px; text-align: center; color: #666;">
            <strong>Total Kehadiran: ${userKehadiran.length} kali</strong>
        </div>
    `;
}

// Member List Functions
function loadAnggotaList() {
    const anggotaData = getAnggotaData();
    const container = document.getElementById('daftarAnggota');
    
    if (anggotaData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Belum ada anggota yang terdaftar</p>
                <small>Silakan registrasi anggota baru di tab Registrasi</small>
            </div>
        `;
        return;
    }
    
    // Sort by name
    anggotaData.sort((a, b) => a.nama.localeCompare(b.nama));
    
    container.innerHTML = anggotaData.map(anggota => `
        <div class="anggota-item">
            <h4>${anggota.nama}</h4>
            <p><i class="fas fa-id-card"></i> <strong>NIM/ID:</strong> ${anggota.nim}</p>
            <p><i class="fas fa-university"></i> <strong>Fakultas:</strong> ${anggota.fakultas}</p>
            <p><i class="fas fa-graduation-cap"></i> <strong>Program Studi:</strong> ${anggota.prodi}</p>
            <p><i class="fas fa-calendar"></i> <strong>Angkatan:</strong> ${anggota.angkatan}</p>
            ${anggota.kontak ? `<p><i class="fas fa-phone"></i> <strong>Kontak:</strong> ${anggota.kontak}</p>` : ''}
            <p><i class="fas fa-check-circle"></i> <strong>Total Kehadiran:</strong> ${anggota.totalKehadiran || 0} kali</p>
            <p class="waktu"><i class="fas fa-user-plus"></i> Terdaftar: ${formatTanggal(anggota.tanggalDaftar.split('T')[0])}</p>
        </div>
    `).join('');
}

function cariAnggota() {
    const query = document.getElementById('cariAnggota').value.toLowerCase();
    const anggotaData = getAnggotaData();
    
    const filteredData = anggotaData.filter(anggota => 
        anggota.nama.toLowerCase().includes(query) ||
        anggota.nim.toLowerCase().includes(query) ||
        anggota.fakultas.toLowerCase().includes(query) ||
        anggota.prodi.toLowerCase().includes(query)
    );
    
    const container = document.getElementById('daftarAnggota');
    
    if (filteredData.length === 0 && query) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Tidak ada anggota yang ditemukan</p>
                <small>dengan kata kunci "${query}"</small>
            </div>
        `;
        return;
    }
    
    if (query === '') {
        loadAnggotaList();
        return;
    }
    
    // Sort by name
    filteredData.sort((a, b) => a.nama.localeCompare(b.nama));
    
    container.innerHTML = filteredData.map(anggota => `
        <div class="anggota-item">
            <h4>${anggota.nama}</h4>
            <p><i class="fas fa-id-card"></i> <strong>NIM/ID:</strong> ${anggota.nim}</p>
            <p><i class="fas fa-university"></i> <strong>Fakultas:</strong> ${anggota.fakultas}</p>
            <p><i class="fas fa-graduation-cap"></i> <strong>Program Studi:</strong> ${anggota.prodi}</p>
            <p><i class="fas fa-calendar"></i> <strong>Angkatan:</strong> ${anggota.angkatan}</p>
            ${anggota.kontak ? `<p><i class="fas fa-phone"></i> <strong>Kontak:</strong> ${anggota.kontak}</p>` : ''}
            <p><i class="fas fa-check-circle"></i> <strong>Total Kehadiran:</strong> ${anggota.totalKehadiran || 0} kali</p>
            <p class="waktu"><i class="fas fa-user-plus"></i> Terdaftar: ${formatTanggal(anggota.tanggalDaftar.split('T')[0])}</p>
        </div>
    `).join('');
}

// Utility Functions
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function formatTanggal(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateStats() {
    const anggotaData = getAnggotaData();
    document.getElementById('totalAnggota').textContent = anggotaData.length;
}

// Add some sample data for demonstration (only if no data exists)
function addSampleData() {
    const anggotaData = getAnggotaData();
    if (anggotaData.length === 0) {
        const sampleData = [
            {
                nim: "D400200001",
                nama: "Ahmad Fajar Sidiq",
                fakultas: "Fakultas Teknik",
                prodi: "Teknik Informatika",
                angkatan: 2020,
                kontak: "081234567890",
                tanggalDaftar: new Date().toISOString(),
                totalKehadiran: 5
            },
            {
                nim: "D400210002",
                nama: "Siti Nurhaliza",
                fakultas: "Fakultas Teknik",
                prodi: "Teknik Elektro",
                angkatan: 2021,
                kontak: "081234567891",
                tanggalDaftar: new Date().toISOString(),
                totalKehadiran: 3
            }
        ];
        saveAnggotaData(sampleData);
        updateStats();
    }
}

// Initialize sample data (uncomment to add sample data)
// addSampleData();