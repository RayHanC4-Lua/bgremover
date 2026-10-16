# Berkontribusi ke BG Remover

[English](CONTRIBUTING.md) | **Bahasa Indonesia**

Terima kasih sudah mau membantu. Laporan bug, ide, terjemahan, dan pull request semuanya diterima.

## Melaporkan bug

Buka [issue](https://github.com/RayHanC4-Lua/bgremover/issues/new/choose) lalu pilih **Bug report**. Sertakan:

- Lokasi masalah: website atau aplikasi Android
- Perangkat dan browser, misalnya "Samsung A52, Chrome 141"
- Langkah untuk memunculkan bug
- Screenshot kalau ada

Jangan upload foto pribadi. Pakai gambar contoh yang ada di aplikasi.

## Mengusulkan fitur

Buka issue lalu pilih **Feature request**. Jelaskan masalah yang ingin diselesaikan, bukan hanya solusinya.

## Persiapan pengembangan

```bash
git clone https://github.com/RayHanC4-Lua/bgremover.git
cd bgremover
python -m http.server 8080 -d public
```

Buka http://localhost:8080. Tidak ada proses build.

## Gaya kode

- Hanya HTML, CSS, dan JavaScript murni. Tanpa framework, bundler, atau dependency runtime baru.
- Semua proses tetap berjalan di perangkat. Jangan pernah mengirim gambar pengguna ke server.
- Ikuti format yang sudah ada: indentasi dua spasi, tanda kutip tunggal di JavaScript.
- Kode di proyek ini tidak memakai komentar. Jelaskan alasan perubahanmu di deskripsi pull request.
- Uji di layar seukuran HP (lebar 360 px) dalam mode terang dan gelap.
- Kalau mengubah file di `public/`, naikkan nilai `CACHE` di `public/sw.js`.

## Pull request

1. Fork repo lalu buat branch dari `main`, misalnya `fix/brush-undo`.
2. Satu pull request untuk satu perubahan.
3. Jelaskan apa yang berubah dan bagaimana kamu mengujinya. Sertakan screenshot sebelum dan sesudah untuk perubahan tampilan.
4. Pastikan situs tetap bisa dipakai offline setelah dibuka pertama kali.

## Aplikasi Android

Aplikasi Android di folder `android/` hanyalah pembungkus WebView. Sebagian besar perubahan cukup di `public/`. Ubah `android/` hanya untuk fitur native seperti memilih file, menyimpan ke galeri, atau warna status bar. Build dilakukan oleh GitHub Actions, jadi kamu tidak perlu Android Studio untuk perubahan web.

## Lisensi

Dengan berkontribusi, kamu setuju bahwa kontribusimu dirilis dengan [Lisensi MIT](LICENSE).
