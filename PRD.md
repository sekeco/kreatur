# 📋 PRD — Kreatur v1.0 (MVP)

> **Dari naskah ke publikasi, rapi dalam satu ruang kerja.**
>
> Product Requirements Document — Frontend & UI.
>
> **Status:** MVP — Early Access (Free). Seluruh pengguna mendapatkan paket Free.
> Monetisasi akan aktif setelah produk mencapai product-market fit.

---

## Daftar Isi

1. [Produk Overview](#1-produk-overview)
2. [Masalah yang Diselesaikan](#2-masalah-yang-diselesaikan)
3. [Target Pengguna & Peran](#3-target-pengguna--peran)
4. [Design Principles](#4-design-principles)
5. [Ruang Lingkup MVP](#5-ruang-lingkup-mvp)
6. [Information Architecture](#6-information-architecture)
7. [Halaman & Komponen — Spesifik](#7-halaman--komponen--spesifik)
8. [Alur Penting (User Flow)](#8-alur-penting-user-flow)
9. [WordPress Integration](#9-wordpress-integration)
10. [Prioritas Implementasi](#10-prioritas-implementasi)

---

## 1. Produk Overview

**Kreatur** adalah platform SaaS untuk manajemen kontributor dan editorial. Kreatur menyatukan proses penulisan, review, persetujuan, pembayaran honor, dan distribusi konten dalam satu ruang kerja — terintegrasi langsung dengan WordPress.

Bayangkan seperti Trello/Asana untuk tim editorial, dengan workflow `Draft → Submit → Review → Approve → Publish`, pencatatan honor otomatis, dan publikasi satu klik ke WordPress.

### Siapa yang pakai?

| Role            | Deskripsi                                      | Bisa ngoding? |
| --------------- | ---------------------------------------------- | :-----------: |
| **Owner**       | Pemilik ruang kerja, atur anggota & pengaturan |      ❌       |
| **Editor**      | Atur kategori, workflow, review, publikasi     |      ❌       |
| **Reviewer**    | Menilai naskah, skor, komentar, keputusan      |      ❌       |
| **Kontributor** | Penulis artikel, lihat feedback, ajukan honor  |      ❌       |
| **Finance**     | Verifikasi & payout honor kontributor          |      ❌       |

> **Semua pengguna adalah non-teknis. Aplikasi harus langsung dimengerti tanpa panduan.**

### Fitur Utama (MVP)

| Fitur                        | Deskripsi Singkat                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| ✅ **Multi-Tenant**          | Setiap organisasi punya ruang kerja sendiri, data terisolasi                       |
| ✅ **Manajemen Kategori**    | Kategori artikel per ruang kerja, bisa import dari WordPress                       |
| ✅ **Artikel CRUD**          | Rich-text editor, draft auto-save, word count                                      |
| ✅ **Workflow Editorial**    | Draft → Submit → Review → Approve/Revisi → Publish                                 |
| ✅ **Review System**         | Skor (1-5), catatan, riwayat review per artikel                                    |
| ✅ **Dashboard Per Role**    | Widget ringkasan, aktivitas terbaru, artikel perlu tindakan                        |
| ✅ **WordPress Integration** | Koneksi REST API, publish 1 klik, user sync                                        |
| ✅ **Honor & Payout**        | Aturan honor per ruang kerja, pengajuan & verifikasi payout                        |
| ✅ **Manajemen Anggota**     | Invite via email/link, role assignment (Owner/Editor/Reviewer/Kontributor/Finance) |
| ✅ **Activity Log**          | Audit trail untuk perubahan status, review, payout                                 |

---

## 2. Masalah yang Diselesaikan

- Naskah, revisi, dan komunikasi redaksi tersebar di chat, email, dan dokumen terpisah.
- Status artikel serta tanggung jawab reviewer tidak transparan bagi kontributor.
- Pembayaran honor sulit direkonsiliasi dengan artikel yang telah terbit.
- Publikasi ke WordPress masih manual — copy-paste dari Google Docs.
- Tim kecil membutuhkan workflow profesional tanpa biaya enterprise.

---

## 3. Target Pengguna & Peran

### Persona 1: Bu Dewi — Pemilik Media Online (45 thn)

- Punya media online dengan 10+ kontributor lepas
- Setiap minggu 20-30 artikel masuk via WhatsApp/Email
- Admin repot tracking siapa yang nulis, siapa yang review, mana yang sudah naik
- Punya **HP Android + Laptop** — bisa internet
- **Gak bisa**: pakai project management tools rumit, Excel, ngerti API

### Persona 2: Mas Adi — Kontributor Lepas (27 thn)

- Menulis artikel untuk 2-3 media
- Dapet brief via WA, ngirim artikel via Google Docs atau email
- Sering bingung artikelnya udah di review belum, kapan dibayar
- **Mau yang simpel**: tulis → kirim → liat status → dapet honor

### Persona 3: Mba Rina — Editor (32 thn)

- Editor di media online, tugas review & approve artikel
- Buka link Google Docs, kasih komen, WA penulis, repeat
- Pengen workflow yang rapi: tinggal approve/reject, penulis langsung notif
- **Butuh**: dashboard yang jelas mana artikel yang perlu review

### Persona 4: Pak Anton — Finance (50 thn)

- Ngurus keuangan di media, bayar honor kontributor tiap bulan
- Data artikel yang terbit dari spreadsheet, transfer manual
- Sering ada selisih karena catatan berbeda
- **Butuh**: laporan jelas, rekonsiliasi gampang

---

## 4. Design Principles

### 4.1 "Bahkan kontributor yang sibuk langsung ngerti"

Setiap halaman harus jelas **"ini buat apa"** dalam 1 detik pertama.
Gunakan heading yang jelas, icon yang familiar, dan hindari jargon teknis.

✅ "Tulis Artikel Baru" ❌ "Create New Post"
✅ "Cari artikel..." ❌ "Query article records"
✅ "Kirim ke Reviewer" ❌ "Submit for Review"

### 4.2 Mobile-first, tapi tetap enak di laptop

- Mayoritas akses kontributor dari **HP Android**
- Semua halaman harus responsif — dari layar 360px sampai 1920px
- Di HP: **satu kolom**, scroll vertikal, tombol gede
- Di desktop: layout dashboard dengan sidebar navigasi

### 4.3 Warna sebagai bahasa

Setiap **status** punya warna yang konsisten di seluruh aplikasi:

| Status               | Warna   | Makna                        |
| -------------------- | ------- | ---------------------------- |
| `DRAFT`              | Abu-abu | Masih ditulis, belum dikirim |
| `PENDING_REVIEW`     | Biru    | Menunggu review              |
| `REVISION_REQUESTED` | Kuning  | Perlu revisi dari penulis    |
| `APPROVED`           | Hijau   | Siap terbit                  |
| `REJECTED`           | Merah   | Tidak lolos                  |
| `PUBLISHED`          | Ungu    | Sudah terbit di WordPress    |
| `ARCHIVED`           | Netral  | Arsip                        |

### 4.4 Konfirmasi sebelum aksi penting

Setiap aksi yang tidak bisa di-undo atau berdampak signifikan harus dikonfirmasi:

- Submit artikel → "Yakin kirim artikel ini ke review?"
- Approve/Reject → "Konfirmasi keputusan dengan catatan (opsional)"
- Bayar payout → "Yakin tandai payout ini sebagai PAID?"
- Hapus artikel → "Yakin hapus? Data akan hilang selamanya."

### 4.5 Feedback instan

- Toast/notifikasi hijau setelah aksi berhasil
- Toast merah + deskripsi kalau error
- Loading spinner/skeleton untuk operasi async

---

## 5. Ruang Lingkup MVP

### 5.1 Ruang Kerja dan Organisasi

- Pendaftaran via signup → langsung masuk halaman **Boarding**
- Boarding: buat ruang kerja → koneksikan WordPress → pilih kategori & user untuk diimport
- Import berjalan di background; user langsung bisa akses dashboard
- Role-based access control via Better Auth (custom roles + Dynamic Access Control)
- Branding dasar (logo, warna) — terbatas
- Zona waktu default `Asia/Jakarta`, bahasa default `id`, mata uang default `IDR`
- Isolasi data tenant: seluruh artikel, pembayaran, koneksi, dan anggota selalu terkait ID ruang kerja

### 5.2 Workflow Editorial

- Artikel dengan status: `DRAFT`, `PENDING_REVIEW`, `REVISION_REQUESTED`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED`
- Editor rich-text (TipTap), output **HTML**
- Word count, kategori per ruang kerja, guideline (text/checklist)
- Submit, assign reviewer, skor dan catatan review, request revision, approve/reject
- Riwayat aktivitas untuk setiap perubahan status
- Dashboard per peran: artikel yang menunggu tindakan, status artikel, ringkasan progres

### 5.3 Honor dan Payout

- Ruang kerja menentukan apakah honor dipakai, nominal per artikel, serta ambang payout
- Kontributor dapat mengajukan payout atas artikel eligible (APPROVED/PUBLISHED)
- Finance/Admin dapat menandai payout `PENDING`, `APPROVED`, `PAID`, atau `REJECTED`
- Pada `PAID`, Finance dapat mengunggah bukti pembayaran
- MVP tidak memindahkan dana secara otomatis; Kreatur mencatat dan mengelola prosesnya

### 5.4 WordPress Integration

- **Tidak memerlukan plugin WordPress.** Koneksi via REST API + Application Password
- **Onboarding:** URL situs → uji koneksi → pilih post type default & mapping kategori → test
- **Publish:** Artikel `APPROVED` dikirim ke WordPress dengan mapping author, kategori, status, slug, tanggal
- **Idempotent:** Kreatur menyimpan `externalPostId` dan `externalPostUrl` — update tidak menggandakan post
- **Retry:** Maksimal 3 percobaan, delay 30 detik. Gagal → retry manual via UI
- **Publish synchronous** untuk MVP (langsung di request-response)

### 5.5 WordPress User Sync

**WordPress → Kreatur:**

- Tombol **Sync Now** menarik data dari WordPress (ID, username, email, display name)
- User WordPress otomatis dibuatkan akun Kreatur (by email) atau di-link jika sudah ada
- User yang dihapus dari WordPress ditandai `is_orphaned = true` (data tetap dipertahankan)

**Kreatur → WordPress:**

- User Kreatur eligible untuk di-push sebagai author WordPress jika:
  1. `email_verified = true`
     Memiliki minimal 1 artikel `APPROVED` di ruang kerja terkait
- Push membuat user WordPress baru via REST API dengan role `author`

### 5.6 AI Suggestions

- **Non-blocking:** Panggil OpenCode Go API di background, hasil tampilkan saat siap
- **Tipe saran:** ringkasan, saran struktur/keterbacaan, cek guideline ruang kerja
- AI hanya memberi **rekomendasi**; keputusan akhir tetap pada manusia
- Per ruang kerja, Owner dapat menonaktifkan AI di pengaturan

### 5.7 Monetisasi dan Paket

**Saat ini semua workspace menggunakan paket Free.** Tidak ada kartu. Gratis penuh selama masa early access.

| Paket  |     Harga | Anggota | Artikel | Koneksi | AI  |
| ------ | --------: | ------: | ------: | ------: | :-: |
| Free   |       Rp0 |      10 |     100 |       1 | ✅  |
| Mulai  |  Rp49.000 |      10 |     300 |       1 | ✅  |
| Tumbuh | Rp149.000 |      30 |       ∞ |       3 | ✅  |
| Studio | Rp399.000 |     100 |       ∞ |      10 | ✅  |

---

## 6. Information Architecture

### 6.1 Navigasi Utama (Sidebar — Desktop)

```
┌────────────────────────────────────────────────────┐
│ [Logo] Kreatur                    [User Avatar ▼]   │
│                                                     │
│ 📊 Dashboard                                        │
│ 📝 Artikel                                          │
│    ├── Semua Artikel                                │
│    └── Tambah Artikel                               │
│ 📂 Kategori                                         │
│ 🔗 Koneksi WordPress                                │
│ 💰 Honor & Payout                                   │
│ 👥 Anggota                                          │
│ ⚙️ Pengaturan                                      │
│    ├── Profil Ruang Kerja                           │
│    ├── Koneksi                                      │
│    └── Honor                                        │
│ ─────────────────────────────────────────────────── │
│ 🎨 Tampilan & Bahasa                                │
│ 👤 Akun Saya                                        │
└────────────────────────────────────────────────────┘
```

### 6.2 Navigasi Mobile (Bottom Nav — HP)

```
┌────────────────────────┐
│                        │
│   [CONTENT AREA]       │
│                        │
├────┬──────┬──────┬─────┤
│ 📊 │ 📝  │ 🔗  │ ⚙️ │
│Dashboard│Artikel│Koneksi│Settings│
└────┴──────┴──────┴─────┘
```

### 6.3 Struktur Halaman

| Halaman                    | URL                                 |
| -------------------------- | ----------------------------------- |
| Landing / Redirect         | `/`                                 |
| Login                      | `/login`                            |
| Register                   | `/register`                         |
| Boarding (new user wizard) | `/boarding`                         |
| Pilih Organisasi           | `/org/select`                       |
| Dashboard                  | `/orgs/[slug]/dashboard`            |
| Daftar Artikel             | `/orgs/[slug]/articles`             |
| Detail / Edit Artikel      | `/orgs/[slug]/articles/[id]`        |
| Review Artikel             | `/orgs/[slug]/articles/[id]/review` |
| Kategori                   | `/orgs/[slug]/categories`           |
| Koneksi WordPress          | `/orgs/[slug]/connections`          |
| Honor & Payout             | `/orgs/[slug]/payouts`              |
| Anggota Tim                | `/orgs/[slug]/members`              |
| Pengaturan — Umum          | `/orgs/[slug]/settings`             |
| Pengaturan — Koneksi       | `/orgs/[slug]/settings/connection`  |
| Pengaturan — Honor         | `/orgs/[slug]/settings/honor`       |
| Invitation Link            | `/join/[slug]`                      |
| Pengaturan Akun User       | `/dashboard/account`                |
| Forgot Password            | `/forgot-password`                  |
| Reset Password             | `/reset-password`                   |

---

## 7. Halaman & Komponen — Spesifik

### 7.1 Landing / Redirect `/`

- Cek session user:
  - Not authenticated → redirect `/login`
  - Authenticated, no org → redirect `/org/select`
  - Authenticated, has org → redirect `/orgs/[slug]/dashboard`

### 7.2 Login `/login`

- Form email + password
- Tombol "Masuk dengan Google"
- Link ke register dan forgot password
- Setelah login sukses → redirect ke `/` (biar middleware yang handle)

### 7.3 Boarding `/boarding`

Multi-step wizard untuk pengguna baru:

**Step 1: Buat Workspace**

- Form: Nama workspace, slug (auto dari nama)
- Tombol: Lanjut

**Step 2: Koneksikan WordPress (Opsional)**

- Form: URL situs WordPress, username, Application Password
- Tombol: "Uji Koneksi" → menampilkan preview kategori & users
- Bisa "Lewati" jika tidak ingin connect sekarang

**Step 3: Konfirmasi**

- Ringkasan workspace + status koneksi WP
- Tombol: "Selesai" → buat workspace & redirect ke dashboard

### 7.4 Dashboard `/orgs/[slug]/dashboard`

- **Widget Welcome** — nama workspace, hint untuk langkah selanjutnya
- **Ringkasan Artikel** — cards: Draft (abu), Pending Review (biru), Approved (hijau), Published (ungu)
- **Aktivitas Terbaru** — 5 event terbaru (artikel di-submit, di-review, di-publish)
- **Artikel Perlu Tindakan** (untuk Editor/Reviewer) — daftar artikel PENDING_REVIEW

### 7.5 Daftar Artikel `/orgs/[slug]/articles`

- Tabel dengan kolom: Judul, Status (badge warna), Kategori, Penulis, Tanggal Update
- Filter: dropdown status + search bar (postgreSQL ILIKE)
- Sorting: updatedAt
- Klik row → detail artikel
- Tombol "Tambah Artikel" → `/orgs/[slug]/articles/new`
- Batch actions: Archive selected
- **Empty state:** "Belum ada artikel. Tulis artikel pertama Anda!"

### 7.6 Detail / Edit Artikel `/orgs/[slug]/articles/[id]`

- **Form:**
  - Judul (input text)
  - Konten — rich-text editor (TipTap), output HTML
  - Excerpt / ringkasan
  - Slug — auto-generate dari judul (bisa diedit)
  - Kategori — multi-select
  - Penulis — auto dari user login
- **Tombol aksi (tergantung role & status):**
  - DRAFT: "Simpan Draft", "Kirim ke Review"
  - PENDING_REVIEW: "Tarik dari Review" (kontributor), "Review" (reviewer)
  - REVISION_REQUESTED: "Simpan Revisi", "Kirim Ulang"
  - APPROVED: "Terbitkan ke WordPress" (editor)
  - PUBLISHED: "Update di WordPress"
- **Auto-save draft** setiap 30 detik
- **Word count** — live counter di bawah editor
- **Activity log** — timeline riwayat perubahan

### 7.7 Review Artikel `/orgs/[slug]/articles/[id]/review`

- **Dua panel:**
  - Kiri: artikel read-only
  - Kanan: panel review
- **Form Review:**
  - Skor (1-5) — star rating
  - Catatan (textarea)
  - Keputusan: Approve / Request Revision / Reject
- Riwayat review sebelumnya (accordion)
- Notifikasi ke kontributor saat review selesai

### 7.8 Kategori `/orgs/[slug]/categories`

- Tabel daftar kategori: Nama, Slug, Jumlah Artikel
- Tombol "Tambah Kategori" → modal form
- Edit via inline atau modal
- Delete dengan konfirmasi (jika ada artikel, tampilkan peringatan)

### 7.9 Koneksi WordPress `/orgs/[slug]/connections`

- **Status koneksi:** Active / Error / Disconnected
- **Form setup (jika belum terkoneksi):**
  - Site URL
  - Username WordPress
  - Application Password
  - Tombol "Test Connection"
- **Jika sudah terkoneksi:**
  - Info koneksi (URL, username, status)
  - Tombol "Sync Users Now" → import WP users
  - Mapping kategori
  - Tombol "Putuskan Koneksi"
- **Sync log** — riwayat sinkronisasi user

### 7.10 Honor & Payout `/orgs/[slug]/payouts`

**Untuk Kontributor:**

- Daftar artikel eligible (APPROVED/PUBLISHED) + honor per artikel
- Total honor terkumpul
- Tombol "Ajukan Payout" → buat payout request
- Riwayat payout request (status: PENDING → APPROVED → PAID / REJECTED)

**Untuk Finance/Admin:**

- Daftar payout request pending
- Approve / Pay (upload bukti transfer) / Reject dengan catatan

### 7.11 Anggota `/orgs/[slug]/members`

- Tabel anggota: Nama, Email, Role, Bergabung
- Tombol "Undang Anggota" → modal form (email, role)
- Edit role via dropdown
- Hapus anggota dengan konfirmasi

### 7.12 Settings `/orgs/[slug]/settings`

- **Profil Workspace:** Nama, slug, logo, deskripsi
- **AI Toggle:** Enable/disable AI suggestions

### 7.13 Pengaturan Akun `/dashboard/account`

- Profil: Nama, Email
- Ganti password
- Akun tertaut (Google/GitHub OAuth)
- Sesi aktif (lihat & revoke)
- Hapus akun (zona berbahaya — konfirmasi email)

---

## 8. Alur Penting (User Flow)

### 8.1 Alur: Pertama Kali Login

```
Signup → /boarding →
  Step 1: Buat workspace (nama, slug) →
  Step 2: (Opsional) Konek WordPress, test connection →
  Step 3: Konfirmasi →
✅ Workspace created → redirect /orgs/[slug]/dashboard
```

### 8.2 Alur: Artikel dari Draft ke Publish

```
Kontributor buka /articles →
  Klik "Tambah Artikel" →
  Tulis judul & konten (auto-save tiap 30 detik) →
  Klik "Kirim ke Review" →
✅ Status → PENDING_REVIEW

Reviewer lihat di dashboard "Artikel Perlu Review" →
  Buka artikel → panel review →
  Baca, beri skor + catatan →
  Approve atau Request Revision →
✅ Status → APPROVED / REVISION_REQUESTED

Jika REVISION_REQUESTED →
  Kontributor revisi → "Kirim Ulang" →
  Reviewer review lagi → Approve →
✅ Status → APPROVED

Editor buka artikel APPROVED →
  Klik "Terbitkan ke WordPress" →
  Pilih status publish/draft, mapping kategori →
  Konfirmasi →
✅ Status → PUBLISHED + externalPostId tersimpan
```

### 8.3 Alur: Honor & Payout

```
Workspace setting honor → atur nominal per artikel + threshold →
Setiap artikel APPROVED/PUBLISHED → honor terakumulasi →
Kontributor buka /payouts →
  Lihat total honor →
  Klik "Ajukan Payout" →
✅ PayoutRequest → PENDING

Finance lihat payout pending →
  Verifikasi → Approve atau Reject →
  Jika Approve → klik "Bayar" → upload bukti transfer →
✅ PayoutRequest → PAID
```

### 8.4 Alur: Invite Anggota Baru

```
Owner/Editor buka /members → "Undang Anggota" →
  Masukkan email + pilih role →
  Sistem kirim email invitation (Better Auth) →
User terima email → klik link → login/signup →
  Otomatis accept invitation → masuk workspace →
Dapat juga via link langsung: `/join/{org-slug}`
```

---

## 9. WordPress Integration

### 9.1 Koneksi

- Form: Site URL, WordPress username, Application Password
- Test connection: `GET /wp/v2/users/me` → validasi credential
- Fetch categories: `GET /wp/v2/categories`
- Fetch users: `GET /wp/v2/users`
- Credential dienkripsi at rest (AES-256)

### 9.2 Publish

- Tombol "Terbitkan ke WordPress" di artikel APPROVED
- Dialog: pilih status (publish/draft), tanggal (opsional), mapping kategori
- REST API: `POST /wp/v2/posts`
- Simpan `externalPostId` dan `externalPostUrl` di Article
- Re-publish: `PUT /wp/v2/posts/{id}` — cegah duplikat
- Retry: 3x attempt, delay 30 detik
- Notifikasi: sukses/gagal ke editor

### 9.3 User Sync

- **Import:** Pull users dari WordPress → cek email → buat akun Kreatur baru atau link via WpUserLink
- **Push:** Push user Kreatur ke WordPress (syarat: email_verified + minimal 1 APPROVED article)
- Tombol **Sync Now** di halaman koneksi
- Background sync saat boarding

---

## 10. Prioritas Implementasi

### P0 — Wajib untuk MVP (Fungsionalitas inti)

| #   | Item                                                | Bagian           |
| --- | --------------------------------------------------- | ---------------- |
| 1   | Auth + Boarding flow                                | Backend/Frontend |
| 2   | Sidebar navigasi + layout                           | Frontend         |
| 3   | Artikel CRUD + rich-text editor                     | Backend/Frontend |
| 4   | Workflow status (Draft → Submit → Review → Approve) | Backend/Frontend |
| 5   | Review system (skor, catatan)                       | Backend/Frontend |
| 6   | Dashboard widget stats                              | Backend/Frontend |

### P1 — Penting untuk MVP (Kelengkapan)

| #   | Item                          | Bagian           |
| --- | ----------------------------- | ---------------- |
| 1   | Manajemen kategori            | Backend/Frontend |
| 2   | Activity log per artikel      | Backend/Frontend |
| 3   | WordPress connection setup    | Backend/Frontend |
| 4   | Publish ke WordPress          | Backend/Frontend |
| 5   | Undang anggota (email + link) | Backend/Frontend |
| 6   | Role management               | Backend/Frontend |
| 7   | Honor & payout rules          | Backend/Frontend |

### P2 — Enhancement (Setelah inti jalan)

| #   | Item                              | Bagian           |
| --- | --------------------------------- | ---------------- |
| 1   | WordPress user sync (2 arah)      | Backend/Frontend |
| 2   | Payout request & approval flow    | Backend/Frontend |
| 3   | AI suggestions                    | Backend/Frontend |
| 4   | Plan enforcement + read-only mode | Backend/Frontend |
| 5   | Dark mode                         | Frontend         |
| 6   | Export / laporan                  | Backend/Frontend |
| 7   | Search (PostgreSQL FTS)           | Backend/Frontend |
| 8   | Notifikasi email                  | Backend          |

---

## Lampiran: Referensi Visual

### Warna Status — Workflow Editorial

| Status               | HEX       | Penggunaan                 |
| -------------------- | --------- | -------------------------- |
| `DRAFT`              | `#9CA3AF` | Gray 400 — masih ditulis   |
| `PENDING_REVIEW`     | `#3B82F6` | Blue 500 — menunggu review |
| `REVISION_REQUESTED` | `#F59E0B` | Amber 500 — perlu revisi   |
| `APPROVED`           | `#10B981` | Emerald 500 — siap terbit  |
| `REJECTED`           | `#EF4444` | Red 500 — tidak lolos      |
| `PUBLISHED`          | `#8B5CF6` | Violet 500 — sudah terbit  |
| `ARCHIVED`           | `#6B7280` | Gray 500 — arsip           |

### Icons

Gunakan icon dari **Lucide** (sudah terinstall di frontend)
