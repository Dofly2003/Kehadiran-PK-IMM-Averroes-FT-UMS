# Sistem Kehadiran PK-IMM Averroes FT-UMS

Sistem absensi berbasis web untuk kegiatan Pengkaderan Khusus Ikatan Mahasiswa Muslimin (PK-IMM) Averroes Fakultas Teknik Universitas Muhammadiyah Surakarta.

## 🌟 Fitur Utama

### 📝 Registrasi Anggota
- Daftarkan anggota baru dengan informasi lengkap
- Validasi NIM/ID untuk mencegah duplikasi
- Penyimpanan data fakultas, program studi, dan angkatan
- Kontak WhatsApp untuk komunikasi

### ✅ Sistem Absensi
- **Absen Masuk**: Pencatatan kehadiran dengan waktu masuk
- **Absen Keluar**: Pencatatan waktu keluar dengan perhitungan durasi otomatis
- Auto-lookup nama berdasarkan NIM/ID
- Kategorisasi jenis kegiatan (Kajian Rutin, Rapat Pengurus, Pelatihan, dll.)
- Validasi untuk mencegah double check-in

### 📊 Riwayat Kehadiran
- Tampilan riwayat kehadiran per anggota
- Pencarian berdasarkan NIM/ID
- Detail waktu masuk, keluar, dan durasi kegiatan
- Status kehadiran (Masuk/Selesai)

### 👥 Manajemen Anggota
- Daftar semua anggota terdaftar
- Pencarian anggota berdasarkan nama, NIM, fakultas, atau program studi
- Statistik total anggota
- Tracking total kehadiran per anggota

## 🚀 Cara Menggunakan

### 1. Registrasi Anggota Baru
1. Klik tab **"Registrasi"**
2. Isi formulir dengan data lengkap:
   - NIM/ID (wajib, unik)
   - Nama Lengkap (wajib)
   - Fakultas (wajib)
   - Program Studi (wajib)
   - Angkatan (wajib)
   - Kontak WhatsApp (opsional)
3. Klik tombol **"Daftar"**

### 2. Melakukan Absensi
1. Klik tab **"Absensi"**
2. Masukkan NIM/ID (nama akan muncul otomatis)
3. Pilih jenis kegiatan
4. Klik **"Absen Masuk"** saat datang
5. Klik **"Absen Keluar"** saat selesai

### 3. Melihat Riwayat
1. Klik tab **"Riwayat"**
2. Masukkan NIM/ID
3. Klik **"Cari"** untuk melihat history kehadiran

### 4. Melihat Daftar Anggota
1. Klik tab **"Daftar Anggota"**
2. Gunakan kotak pencarian untuk filter anggota
3. Lihat statistik total anggota

## 💾 Penyimpanan Data

Sistem menggunakan **Local Storage** browser untuk menyimpan data:
- `pk_imm_anggota`: Data anggota terdaftar
- `pk_imm_kehadiran`: Data kehadiran/absensi

> **Catatan**: Data tersimpan secara lokal di browser. Untuk deployment production, disarankan menggunakan database server.

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur aplikasi web
- **CSS3**: Styling dengan gradient modern dan responsive design
- **JavaScript (Vanilla)**: Logika aplikasi dan interaksi
- **Font Awesome**: Icon library (via CDN)
- **Local Storage API**: Penyimpanan data lokal

## 📱 Responsive Design

Sistem telah dioptimalkan untuk berbagai ukuran layar:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Small Mobile (< 480px)

## 🎨 Fitur UI/UX

- **Modern Glass Design**: Efek backdrop blur dan transparansi
- **Smooth Animations**: Transisi halus antar elemen
- **Color-coded Status**: Pesan sukses/error dengan warna yang jelas
- **Auto-clear Forms**: Form otomatis bersih setelah submit
- **Real-time Validation**: Validasi input secara real-time
- **Indonesian Localization**: Semua teks dalam Bahasa Indonesia

## 📁 Struktur File

```
Kehadiran-PK-IMM-Averroes-FT-UMS/
├── index.html          # File HTML utama
├── styles.css          # Stylesheet aplikasi
├── script.js           # JavaScript untuk logika aplikasi
└── README.md           # Dokumentasi
```

## 🔧 Instalasi dan Menjalankan

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Dofly2003/Kehadiran-PK-IMM-Averroes-FT-UMS.git
   cd Kehadiran-PK-IMM-Averroes-FT-UMS
   ```

2. **Jalankan dengan HTTP Server**:
   ```bash
   # Menggunakan Python
   python3 -m http.server 8000
   
   # Atau menggunakan Node.js
   npx serve .
   
   # Atau menggunakan PHP
   php -S localhost:8000
   ```

3. **Buka Browser**:
   Akses `http://localhost:8000`

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 📝 Contoh Data

Untuk testing, Anda dapat menggunakan data contoh:

**Anggota:**
- NIM: D400210001
- Nama: Muhammad Rizki Pratama
- Fakultas: Fakultas Teknik
- Prodi: Teknik Informatika
- Angkatan: 2021

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dibuat untuk kepentingan PK-IMM Averroes Fakultas Teknik UMS.

## 📞 Kontak

PK-IMM Averroes Fakultas Teknik UMS
- Website: [Fakultas Teknik UMS](https://ft.ums.ac.id)
- Email: info@ft.ums.ac.id

---

**© 2024 PK-IMM Averroes Fakultas Teknik UMS**  
*Dibuat dengan ❤️ untuk kemudahan absensi kegiatan*