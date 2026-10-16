<p align="center">
  <img src="store/store-icon-512.png" width="96" height="96" alt="Ikon BG Remover">
</p>

<h1 align="center">BG Remover</h1>

<p align="center">
  Penghapus latar gambar gratis dan privat yang berjalan sepenuhnya di perangkatmu.<br>
  Tersedia versi web dan aplikasi Android. Tanpa daftar, tanpa upload, tanpa watermark.
</p>

<p align="center">
  <a href="README.md">English</a> | <b>Bahasa Indonesia</b>
</p>

<p align="center">
  <a href="https://removebg.sbs"><img alt="Website" src="https://img.shields.io/badge/web-removebg.sbs-2f6bff"></a>
  <a href="LICENSE"><img alt="Lisensi: MIT" src="https://img.shields.io/badge/license-MIT-green"></a>
  <a href="https://github.com/RayHanC4-Lua/bgremover/actions/workflows/android.yml"><img alt="Build Android" src="https://github.com/RayHanC4-Lua/bgremover/actions/workflows/android.yml/badge.svg"></a>
  <img alt="Android 7.0+" src="https://img.shields.io/badge/android-7.0%2B-3ddc84">
</p>

<p align="center">
  <img src="store/screenshot-1.png" width="180" alt="Layar utama">
  <img src="store/screenshot-2.png" width="180" alt="Hasil">
  <img src="store/screenshot-3.png" width="180" alt="Alat edit">
</p>

## Coba sekarang

- **Web:** https://removebg.sbs
- **Android:** sedang dalam closed testing di Google Play. Mau bantu? Lihat [Jadi tester](#jadi-tester).

## Fitur

- **Potong otomatis** dengan model AI ringan (U2-Net-P) dan penghalusan tepi
- **Mode Portrait HD** dengan MODNet untuk rambut dan tepi yang lebih detail
- **100% di perangkat:** gambar diproses di browser atau HP dan tidak pernah diupload
- **Alat edit:** ganti latar dengan warna, gradien, gambar sendiri, atau versi blur dari foto asli, kuas untuk menghapus atau mengembalikan bagian dengan undo, preset ukuran, bayangan, dan outline
- **Slider perbandingan** sebelum dan sesudah
- **Ekspor** ke PNG, JPG, atau WebP. Aplikasi Android menyimpan langsung ke galeri
- **Bisa offline** setelah dibuka pertama kali (PWA)
- **Mode terang dan gelap**
- Seret dan lepas, pilih file, atau tempel dari clipboard

## Cara kerja

1. Gambar dibaca lalu diperkecil sampai sisi terpanjang maksimal 2048 px.
2. Web Worker menjalankan model U2-Net-P berformat ONNX lewat ONNX Runtime Web (WASM) untuk membuat mask.
3. Mask diperbesar lalu dihaluskan dengan guided filter supaya tepinya mengikuti gambar asli.
4. Mask dijadikan kanal alpha hasil potongan. Semua proses tetap di memori perangkatmu.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Aplikasi web | HTML, CSS, dan JavaScript murni. Tanpa framework, tanpa proses build |
| Runtime AI | ONNX Runtime Web (WASM) di dalam Web Worker |
| Model | U2-Net-P (sekitar 4 MB), MODNet untuk Portrait HD (sekitar 25 MB) |
| Hosting | Cloudflare Workers static assets, deploy otomatis setiap push |
| Aplikasi Android | WebView native berbasis Java, Android 7.0 (API 24) ke atas, target API 36 |
| CI Android | GitHub Actions membuat AAB dan APK yang sudah ditandatangani |
| Pendaftaran tester | Supabase (tabel khusus insert dengan row level security) |

## Struktur proyek

```
bgremover/
  public/                 Website di removebg.sbs
    index.html            Alat utama
    about/ contact/ privacy/ testers/
    js/                   Logika aplikasi, worker, editor, animasi
    css/style.css
    models/               Model ONNX
    vendor/ort/           ONNX Runtime Web
    sw.js                 Service worker (cache offline)
    manifest.webmanifest
  android/                Aplikasi Android (WebView)
  store/                  Ikon, feature graphic, dan screenshot Google Play
  supabase/testers.sql    Tabel pendaftaran tester
  .github/workflows/      Pipeline build Android
  wrangler.jsonc          Konfigurasi Cloudflare
```

## Menjalankan secara lokal

Butuh Python 3. Halaman tidak bisa dibuka lewat `file://`, jadi pakai server lokal:

```bash
git clone https://github.com/RayHanC4-Lua/bgremover.git
cd bgremover
python -m http.server 8080 -d public
```

Lalu buka http://localhost:8080.

Cara yang sama juga berjalan di Termux pada Android.

## Deploy website

1. Fork atau push repo ini ke GitHub.
2. Di dashboard Cloudflare, buka Workers & Pages, pilih Create, lalu hubungkan repo.
3. Kosongkan build command. Biarkan deploy command `npx wrangler deploy`.
4. Setiap push ke branch utama akan men-deploy ulang situs.

Service worker memakai strategi cache-first. Setelah mengubah file di `public/`, naikkan nilai `CACHE` di `public/sw.js` (misalnya `app-v14` menjadi `app-v15`) agar pengguna mendapat versi terbaru.

## Build aplikasi Android

Aplikasi Android adalah WebView native yang membuka `https://removebg.sbs/?source=app`. Perubahan di website langsung terlihat di aplikasi. Build baru hanya perlu kalau ada perubahan di folder `android/`.

1. Buat upload keystore lalu tambahkan dua repository secret:
   - `ANDROID_KEYSTORE_BASE64`: isi keystore yang di-encode dengan `base64 -w0`
   - `ANDROID_KEYSTORE_PASSWORD`: password-nya (alias key `upload`)
2. Buka tab Actions, jalankan **Android build**, lalu isi nama versi.
3. Download artifact-nya. Isinya `app-release.aab` untuk Google Play dan `app-release.apk` untuk dicoba.

Version code naik otomatis setiap kali workflow dijalankan.

## Jadi tester

Google Play mewajibkan 12 tester selama 14 hari sebelum aplikasi baru bisa dirilis untuk umum. Kalau kamu punya HP Android, daftar di **https://removebg.sbs/testers** lalu install aplikasinya dari Google Play. Terima kasih!

## Batasan

- Rambut yang sangat halus atau objek transparan bisa kurang sempurna dengan model standar. Untuk foto orang, coba Portrait HD.
- Sisi terpanjang gambar dibatasi 2048 px.
- Kecepatan bergantung pada perangkat.

## Kontribusi

Laporan bug, ide, dan pull request sangat diterima. Baca dulu [CONTRIBUTING.id.md](CONTRIBUTING.id.md). Untuk masalah keamanan, lihat [SECURITY.id.md](SECURITY.id.md).

## Lisensi dan atribusi

Kode proyek ini dirilis dengan [Lisensi MIT](LICENSE).

- [U2-Net](https://github.com/xuebinqin/U-2-Net) oleh Xuebin Qin dkk., Apache License 2.0. Berkas ONNX dari rilis [rembg](https://github.com/danielgatis/rembg).
- [MODNet](https://github.com/ZHKKKe/MODNet) oleh Zhanghan Ke dkk., Apache License 2.0. Ekspor ONNX dari [Xenova/modnet](https://huggingface.co/Xenova/modnet).
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) oleh Microsoft, Lisensi MIT.

Kalau mengganti model, periksa lisensinya dulu. Beberapa model populer, misalnya BRIA RMBG, tidak boleh dipakai untuk tujuan komersial.

BG Remover adalah proyek independen dan tidak berafiliasi dengan remove.bg maupun Canva.

## Dukungan

Kalau alat ini membantu, kamu bisa mendukung lewat [Trakteer](https://trakteer.id/areeyhanc/tip?open=true).

Dibuat oleh [RyHanC](https://ryhanc.wtf/).
