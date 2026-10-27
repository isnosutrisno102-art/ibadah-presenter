# Ibadah Presenter — versi awal

Web presentasi ibadah dengan pratinjau kamera + slide berdampingan, editor lirik, contoh ayat Alkitab, dan impor slide PDF/gambar.

## Persyaratan
- Node.js 20 atau lebih baru (disarankan)
- Google Chrome atau Microsoft Edge
- Webcam / kamera USB (opsional)

## Menjalankan
1. Ekstrak ZIP ini.
2. Buka folder `ibadah-presenter` di VS Code.
3. Buka terminal di folder tersebut.
4. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka URL yang ditampilkan terminal, biasanya `http://localhost:5173`.
6. Klik **Aktifkan kamera** dan izinkan akses kamera browser.

## Menggunakan slide PowerPoint
Untuk versi awal ini, ekspor presentasi PowerPoint ke PDF terlebih dahulu:
- PowerPoint: File → Export (atau Save As) → PDF.
- Di web, klik **Unggah PDF dari PowerPoint**.
- Setiap halaman PDF akan menjadi satu slide.
Anda juga dapat mengunggah beberapa gambar slide sekaligus (PNG/JPG).

## Menggunakan proyektor/TV
- Sambungkan TV/proyektor ke komputer.
- Tekan `Win + P` lalu pilih **Extend** (Perluas).
- Pindahkan jendela browser ke layar proyektor dan tekan `F11` untuk layar penuh.
- Versi ini menyediakan pratinjau dan kontrol dalam satu halaman; pemisahan output operator dan proyektor ke dua jendela yang tersinkronisasi belum diimplementasikan. Jangan gunakan tombol “Buka layar proyektor” sebagai output produksi; itu hanya placeholder petunjuk untuk versi berikutnya.

## Catatan penting
- Akses kamera browser memerlukan `localhost` atau HTTPS.
- Contoh lirik dan ayat hanya data demonstrasi; periksa ejaan dan terjemahan sebelum ibadah.
- Versi pertama belum menyertakan output terpisah yang tersinkronisasi, streaming langsung, audio mixing, atau pembacaan file `.pptx` secara langsung.
