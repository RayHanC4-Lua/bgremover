# Penghapus Latar

Penghapus latar gambar gratis yang berjalan 100% di browser. Gambar tidak diunggah ke server mana pun.

Demo: https://bgremover.areeeeyysu.workers.dev

## Fitur

- Hapus latar otomatis dengan model AI ringan (U2-Net-P) lewat ONNX Runtime Web
- Privat: seluruh proses terjadi di perangkat pengguna
- Pilihan latar transparan, putih, hitam, atau warna bebas
- Unduh hasil sebagai PNG
- Seret dan lepas, pilih file, atau tempel dari clipboard
- Tema gelap dan terang
- PWA: bisa dipasang dan dipakai offline setelah dimuat pertama kali

## Teknologi

- HTML, CSS, dan JavaScript murni tanpa framework dan tanpa proses build
- ONNX Runtime Web (backend WASM) berjalan di Web Worker
- Model U2-Net-P berformat ONNX (sekitar 4 MB)
- Cloudflare Workers static assets untuk hosting

## Struktur proyek

    bgremover/
        public/
            index.html
            manifest.webmanifest
            sw.js
            robots.txt
            _headers
            css/style.css
            js/main.js
            js/ui.js
            js/model.js
            js/worker.js
            js/image.js
            js/theme.js
            js/editor.js
            vendor/ort/
            models/u2netp.onnx
            assets/icons/
        wrangler.jsonc
        package.json
        .gitignore
        LICENSE
        README.md

## Menjalankan secara lokal

Butuh Python 3. Halaman tidak bisa dibuka lewat file://, jadi perlu server lokal.

    git clone https://github.com/RayHanC4-Lua/bgremover.git
    cd bgremover
    python -m http.server 8080 -d public

Buka http://localhost:8080 di browser.

## Deploy ke Cloudflare

1. Push repo ke GitHub
2. Di dashboard Cloudflare buka Workers & Pages, lalu Create dan hubungkan repo
3. Kosongkan build command dan biarkan deploy command npx wrangler deploy
4. Setiap git push ke branch utama akan men-deploy ulang secara otomatis

Folder situs ditentukan di wrangler.jsonc (./public).

## Memperbarui versi

Service worker memakai cache-first. Setelah mengubah file di public/, naikkan nilai CACHE di public/sw.js (misalnya app-v2 menjadi app-v3) agar pengguna menerima versi terbaru.

## Batasan

- Model ringan: rambut sangat halus atau objek tembus pandang bisa kurang sempurna
- Sisi terpanjang gambar dibatasi 2048 piksel
- Kecepatan bergantung pada perangkat pengguna

## Lisensi dan atribusi

Kode proyek ini berlisensi MIT, lihat berkas LICENSE.

- U2-Net oleh Xuebin Qin dan Friends, lisensi Apache 2.0
- ONNX Runtime Web oleh Microsoft, lisensi MIT
- Berkas model ONNX berasal dari rilis proyek rembg
- MODNet oleh Zhanghan Ke dan kawan-kawan
  
Jika mengganti model, periksa lisensinya terlebih dahulu. Beberapa model populer (misalnya RMBG dari BRIA) tidak boleh dipakai untuk tujuan komersial.

## Dukungan

Jika alat ini membantu, dukung lewat Trakteer: https://trakteer.id/areeyhanc/tip?open=true

Portofolio pembuat: https://ryhanc.wtf/
