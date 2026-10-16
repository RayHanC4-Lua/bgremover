# Kebijakan Keamanan

[English](SECURITY.md) | **Bahasa Indonesia**

## Versi yang didukung

Hanya versi terbaru website di https://removebg.sbs dan rilis Android terbaru yang didukung.

## Melaporkan celah keamanan

Mohon jangan membuka issue publik untuk masalah keamanan.

Kirim email ke **hello.ryhanc@gmail.com** berisi:

- Penjelasan masalah dan dampaknya
- Langkah untuk memunculkannya
- Perangkat dan browser, kalau relevan

Kamu akan mendapat balasan dalam 7 hari. Setelah diperbaiki, namamu bisa dicantumkan di changelog kalau kamu mau.

## Cakupan

- Website dan service worker-nya
- Aplikasi Android di folder `android/`
- Form pendaftaran tester dan tabel Supabase-nya

Gambar pengguna tidak pernah keluar dari perangkat, jadi tidak ada penyimpanan gambar di server yang bisa diserang. Laporan tentang layanan pihak ketiga (Cloudflare, Supabase, Google Play) sebaiknya dikirim ke penyedia layanan tersebut.
