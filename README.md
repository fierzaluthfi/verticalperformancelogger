# 🏍️ MotoTrack - Motorcycle Touring GPS Logger (Strava for Bikers)

Aplikasi GPS Logger & Performance Tracker khusus touring sepeda motor seperti Strava dengan **visualisasi rute course di peta** yang terbagi menjadi sektor warna kecepatan dinamis:
- 🔴 **Merah (Cepat / Geber Gas)**: Kecepatan tinggi (Default: $\ge 70\text{ km/h}$)
- 🟢 **Hijau (Normal / Cruising Santai)**: Kecepatan sedang stabil (Default: $30 - 70\text{ km/h}$)
- 🟠 **Oranye (Lambat / Macet / Tanjakan Terjal)**: Kecepatan rendah (Default: $\le 30\text{ km/h}$)

---

## ✨ Fitur Utama

1. **Interactive Route Map (Leaflet & OpenStreetMap)**:
   - Polyline rute dengan pewarnaan dinamis per sektor kecepatan.
   - Pilihan layer peta: **Night Mode Dark** (sangat estetik & kontras tinggi untuk motor), **Road/Street**, dan **Satellite**.
   - Marker posisi motor real-time berputar mengikuti arah perjalanan (*heading*).
   - Penanda titik Start & Finish.
   - Fit-to-bounds dan auto follow rider.

2. **Speedometer HUD (Heads-Up Display)**:
   - Desain gauge digital circular kontras tinggi agar mudah dibaca di stang/phone holder motor.
   - **Current Speed** (km/h) dengan aksen warna sektor aktif.
   - **Top Speed (Max)** & **Average Speed (Avg)**.
   - **Total Waktu Tempuh** (HH:MM:SS) & Moving Time.
   - **Total Jarak Tempuh** (km).
   - **Elevasi / Ketinggian** (meter dpl).

3. **Distribusi Sektor**:
   - Visualisasi progress bar breakdown persentase jarak & waktu: berapa % Anda melaju cepat (merah), normal (hijau), dan lambat (oranye).

4. **Simulasi Touring Live (Demo Mode)**:
   - Dilengkapi tombol **"Simulasi Demo"** untuk menguji coba rute motor meliuk di perbukitan lengkap dengan speedometer hidup dan jalur warna-warni sebelum Anda turun ke jalan.

5. **Riwayat Sesi & Export GPX**:
   - Simpan setiap perjalanan touring ke storage lokal.
   - **Export ke format GPX** standar yang bisa langsung di-upload ke **Strava, Garmin Connect, Google Earth, atau Relive**.

6. **Keep Screen Awake**:
   - Mencegah layar smartphone mati otomatis saat diletakkan di dudukan motor (*phone holder*).

7. **Batas Kecepatan Dapat Dikustomisasi**:
   - Anda bebas mengubah batas kilometer per jam untuk warna Merah, Hijau, dan Oranye di menu Pengaturan.

---

## 🚀 Cara Menjalankan & Mencoba di PC / Browser

Aplikasi ini dapat langsung dicoba di browser Anda:

```bash
# 1. Masuk ke direktori
cd "d:\New folder\VerticalPerformanceLogger"

# 2. Jalankan development server
npm run dev
```

Buka URL yang muncul (misalnya `http://localhost:3000`) di browser Anda atau browser HP yang terhubung ke jaringan Wi-Fi yang sama.

---

## 📱 Cara Build Menjadi APK Android

Proyek ini telah dikonfigurasi penuh dengan **Capacitor Android** dan siap di-build menjadi file `.apk` dengan beberapa cara:

### Cara 1: Menggunakan Android Studio (Paling Mudah)
1. Jalankan perintah untuk membuka project di Android Studio:
   ```bash
   npx cap open android
   ```
   *(Atau buka Android Studio, lalu pilih **Open Project** dan arahkan ke folder `android` di dalam project ini)*.
2. Tunggu Gradle selesai melakukan sinkronisasi dependensi.
3. Klik menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Setelah selesai, file APK siap di-install di HP Android Anda (lokasi: `android/app/build/outputs/apk/debug/app-debug.apk`).

### Cara 2: Build Langsung via Terminal (Gradle)
Jika Anda sudah memiliki Android SDK & Java terpasang:
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
File APK akan berada di `android/app/build/outputs/apk/debug/app-debug.apk`.

### Cara 3: Build Otomatis di Cloud Gratis via GitHub Actions
Kami sudah menyediakan workflow `.github/workflows/build-apk.yml`:
1. Buat repository baru di akun GitHub Anda dan push kode ini.
2. Buka tab **Actions** di GitHub repository Anda.
3. GitHub akan otomatis mem-build file APK Android.
4. Download artifact `mototrack-touring-logger-apk` yang berisi file `app-debug.apk` dan langsung install di HP Anda!

---

## 📋 Izin Android yang Diberikan (AndroidManifest.xml)
- `ACCESS_FINE_LOCATION`: Untuk akurasi GPS tinggi di jalan raya.
- `ACCESS_COARSE_LOCATION`: Penentuan lokasi awal.
- `ACCESS_BACKGROUND_LOCATION`: Melacak rute saat aplikasi berjalan di background.
- `WAKE_LOCK`: Menjaga layar tetap aktif di stang motor.
- `FOREGROUND_SERVICE`: Menjaga tracking tidak dimatikan oleh sistem Android.
