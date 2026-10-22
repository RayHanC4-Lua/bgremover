-- Kunci tabel testers
-- Jalankan SETELAH Worker dan form baru sudah jalan normal.
-- Setelah ini hanya Worker (pakai secret key) yang bisa menambah tester.

-- Hapus izin daftar langsung dari browser
drop policy if exists "Anyone can sign up as tester" on public.testers;

-- Cabut semua akses anon ke tabel
revoke insert, select, update, delete on public.testers from anon;
