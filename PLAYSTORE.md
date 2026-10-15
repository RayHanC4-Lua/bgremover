# Rilis BG Remover ke Google Play

Aplikasi Android ini adalah Trusted Web Activity (TWA) yang membuka https://removebg.sbs di dalam Chrome tanpa bar alamat.

- Package name: `sbs.removebg.app`
- Project Android: folder `android/`
- Build otomatis: `.github/workflows/android.yml`
- Aset Play Store: folder `store/`

## 1. Simpan keystore sebagai GitHub Secret

Keystore (`upload.keystore`) dan password ada di ZIP terpisah. Jangan commit ke repo.

Di Termux, buat base64 dari keystore:

```bash
base64 -w0 upload.keystore > keystore.b64.txt
```

Buka repo di GitHub, lalu Settings > Secrets and variables > Actions > New repository secret:

| Nama | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | isi file `keystore.b64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | password di `password.txt` |

Alias key: `upload`. Password key sama dengan password keystore.

## 2. Deploy website dan cek Digital Asset Links

Push perubahan ke `main`, tunggu Cloudflare deploy, lalu buka:

```
https://removebg.sbs/.well-known/assetlinks.json
```

Harus tampil JSON, bukan 404 atau halaman HTML. Bisa juga dicek di:
https://developers.google.com/digital-asset-links/tools/generator

## 3. Build AAB

GitHub > tab Actions > Android build > Run workflow > isi versi (misal `1.0.0`).

Atau dari Termux dengan tag:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Setelah selesai, download artifact. Isinya:

- `app-release.aab` untuk upload ke Play Console
- `app-release.apk` untuk dicoba langsung di HP

Version code naik otomatis setiap build.

## 4. Play Console

1. Buat aplikasi baru: nama `BG Remover`, App, Free.
2. Aktifkan Play App Signing (default).
3. Upload `app-release.aab` ke Testing > Closed testing.
4. Akun developer pribadi yang baru wajib closed test minimal 12 tester selama 14 hari sebelum bisa ajukan Production.

## 5. Langkah wajib setelah upload pertama

Play akan menandatangani ulang aplikasi dengan key milik Google. Agar bar alamat tidak muncul di versi Play Store:

1. Play Console > Test and release > App integrity > App signing.
2. Salin SHA-256 dari "App signing key certificate".
3. Tambahkan ke `public/.well-known/assetlinks.json` sebagai fingerprint kedua:

```json
"sha256_cert_fingerprints": [
  "7C:20:82:EC:68:65:3E:A0:4D:AC:DB:F3:CF:16:77:6D:99:DC:6E:F7:47:51:3E:98:28:DE:78:01:2D:C4:D3:4F",
  "SHA256_DARI_PLAY_CONSOLE"
]
```

4. Push, lalu tutup dan buka ulang aplikasinya di HP.

## 6. Store listing

Aset siap pakai di folder `store/`:

- `store-icon-512.png` untuk App icon
- `feature-graphic.png` (1024x500) untuk Feature graphic
- `screenshot-1.png` sampai `screenshot-5.png` (1080x1920) untuk Phone screenshots

App name:
```
BG Remover: Remove Background
```

Short description (maks 80 karakter):
```
Remove image backgrounds free. Private, on-device, no sign-up, no watermark.
```

Full description:
```
BG Remover cuts out the background of any photo in seconds. Pick an image, and an AI model running on your phone separates the subject from the background. You get a clean transparent PNG, ready for product photos, profile pictures, stickers and designs.

Private by design
Your photos are processed on your device. They are never uploaded to a server and never stored by us.

Free and unlimited
No account, no daily limit, no watermark.

Built-in editing tools
- Replace the background with a color, gradient, your own image, or a blurred copy of the original
- Magic brush to erase leftovers or restore missed parts, with undo
- Resize and crop to the subject
- Portrait HD mode for sharper hair and edges
- Before and after compare slider
- Download as PNG, JPG or WebP

Works offline
After the first launch, the standard model is saved on your phone so you can keep using it without internet.

Light and dark mode included.
```

Kategori: Photography. Email kontak: `hello.ryhanc@gmail.com`. Website: `https://removebg.sbs`. Privacy policy: `https://removebg.sbs/privacy/`.

## 7. App content (Policy)

| Bagian | Jawaban |
|---|---|
| Privacy policy | `https://removebg.sbs/privacy/` |
| Ads | Yes, my app contains ads (karena AdSense ada di website) |
| App access | All functionality is available without special access |
| Content rating | Isi kuesioner, kategori Utility/Productivity, semua jawaban No. Hasilnya biasanya Everyone / 3+ |
| Target audience | 18 and over (atau 13+). Jangan pilih usia di bawah 13 karena ada iklan AdSense |
| News app | No |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health | No |

Data safety:

| Pertanyaan | Jawaban |
|---|---|
| Collect or share user data? | Yes |
| Data types | Device or other IDs |
| Collected / Shared | Collected dan Shared |
| Tujuan | Advertising or marketing |
| Processed ephemerally? | No |
| Required or optional? | Required |
| Encrypted in transit? | Yes |
| Users can request deletion? | No (tidak ada akun) |

Foto pengguna tidak perlu dideklarasikan karena diproses di HP dan tidak pernah dikirim. Kalau suatu saat iklan dimatikan, Data safety bisa diubah ke "No data collected".

## 8. Update aplikasi

Perubahan di website langsung muncul di aplikasi tanpa upload ulang. Build AAB baru hanya perlu kalau mengubah isi folder `android/` (ikon, warna, nama, target SDK).
