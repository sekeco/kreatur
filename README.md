![Kreatur](https://img.shields.io/badge/Kreatur-v1.0-emerald?style=for-the-badge&labelColor=1e293b)

# ✅ Kreatur — Platform Manajemen Kontributor & Editorial untuk Media Online

**Kreatur** adalah platform SaaS white-label yang menyatukan proses penulisan, review, persetujuan, pembayaran honor, dan distribusi konten dalam satu ruang kerja — terintegrasi langsung dengan WordPress.

Bayangkan seperti Trello/Asana untuk tim editorial, dengan workflow `Draft → Submit → Review → Approve → Publish`, pencatatan honor otomatis, dan publikasi satu klik ke WordPress.

> 🚀 **Dari naskah ke publikasi, rapi dalam satu ruang kerja.**

---

## 🌟 Kenapa Kreatur?

### Masalah yang Dipecahkan

| Masalah                                                           | Dampak                                         | Solusi Kreatur                                       |
| ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Naskah, revisi, & komunikasi tersebar di chat, email, Google Docs | Tidak ada satu sumber kebenaran                | Semua naskah terpusat di satu platform               |
| Status artikel tidak transparan bagi kontributor                  | Kontributor bingung sudah di-review atau belum | Status real-time: Draft → Review → Approve → Publish |
| Pembayaran honor sulit direkonsiliasi                             | Finance repot cocokkan artikel vs pembayaran   | Honor otomatis, payout request + verifikasi          |
| Publikasi ke WordPress masih copy-paste                           | Rentan human error, makan waktu                | Publish 1 klik via REST API                          |
| Tim kecil butuh workflow profesional                              | Harga tools enterprise terlalu mahal           | SaaS terjangkau, bahkan gratis untuk early access    |

### Value Proposition

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║  ✅ Naskah, review, & payout dalam satu platform   ║
║  ✅ Workflow editorial profesional, tanpa ribet    ║
║  ✅ Publikasi 1 klik ke WordPress                  ║
║  ✅ Honor kontributor tercatat & terverifikasi     ║
║  ✅ Transparan untuk semua peran                   ║
║                                                    ╚
╚════════════════════════════════════════════════════╝
```

---

## 💼 Buat Siapa Kreatur?

Kreatur dirancang untuk **tim editorial dan kontributor lepas** di organisasi konten:

| Organisasi                  | Contoh Penggunaan                               |
| --------------------------- | ----------------------------------------------- |
| 📰 **Media Online**         | Manajemen artikel, review, publish ke WordPress |
| 🏘️ **Komunitas**            | Kurasi kontribusi anggota, publikasi newsletter |
| 🏢 **Agensi/Korporasi**     | Workflow konten marketing, approval klien       |
| 🎓 **Institusi Pendidikan** | Jurnal ilmiah, publikasi kampus                 |
| 🏷️ **Brand**                | Manajemen konten blog, contributor management   |

| Role            | Deskripsi                                      |
| --------------- | ---------------------------------------------- |
| **Owner**       | Pemilik ruang kerja, atur anggota & pengaturan |
| **Editor**      | Atur kategori, workflow, review, publikasi     |
| **Reviewer**    | Menilai naskah, skor, komentar, keputusan      |
| **Kontributor** | Penulis artikel, lihat feedback, ajukan honor  |
| **Finance**     | Verifikasi & payout honor kontributor          |

> **Semua pengguna adalah non-teknis. Aplikasi harus langsung dimengerti tanpa panduan.**

---

## ✨ Fitur Utama (MVP)

| Fitur                        | Deskripsi                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| ✅ **Multi-Tenant**          | Setiap organisasi punya ruang kerja sendiri, data terisolasi                       |
| ✅ **Artikel CRUD**          | Rich-text editor (TipTap), draft auto-save tiap 30 detik, word count               |
| ✅ **Workflow Editorial**    | `DRAFT → PENDING_REVIEW → REVISION_REQUESTED → APPROVED → PUBLISHED`               |
| ✅ **Review System**         | Skor 1-5, catatan, riwayat review per artikel, decision (approve/revisi/reject)    |
| ✅ **Manajemen Kategori**    | Kategori per ruang kerja, import dari WordPress                                    |
| ✅ **Dashboard Per Role**    | Widget ringkasan, aktivitas terbaru, artikel perlu tindakan                        |
| ✅ **WordPress Integration** | Koneksi REST API via Application Password, publish 1 klik, user sync 2 arah        |
| ✅ **Honor & Payout**        | Aturan honor per ruang kerja, pengajuan & verifikasi payout, upload bukti transfer |
| ✅ **Manajemen Anggota**     | Invite via email/link, 5 role (Owner/Editor/Reviewer/Kontributor/Finance)          |
| ✅ **Activity Log**          | Audit trail untuk perubahan status, review, payout                                 |
| ✅ **AI Suggestions**        | Rekomendasi non-blocking: ringkasan, struktur, cek guideline                       |

---

## 🧭 Navigator Halaman

Setelah login, pengguna akan masuk ke ruang kerja masing-masing:

| Halaman               | URL                                 | Untuk                                          |
| --------------------- | ----------------------------------- | ---------------------------------------------- |
| **Boarding**          | `/boarding`                         | User baru — buat ruang kerja + konek WordPress |
| **Dashboard**         | `/orgs/[slug]/dashboard`            | Ringkasan stats & aktivitas                    |
| **Daftar Artikel**    | `/orgs/[slug]/articles`             | Kelola semua artikel                           |
| **Detail Artikel**    | `/orgs/[slug]/articles/[id]`        | Tulis/edit artikel + timeline aktivitas        |
| **Review**            | `/orgs/[slug]/articles/[id]/review` | Panel review (2 panel: artikel + form review)  |
| **Kategori**          | `/orgs/[slug]/categories`           | Kelola kategori artikel                        |
| **Koneksi WordPress** | `/orgs/[slug]/connections`          | Setup & sync WordPress                         |
| **Honor & Payout**    | `/orgs/[slug]/payouts`              | Aturan honor & payout request                  |
| **Anggota**           | `/orgs/[slug]/members`              | Undang & kelola anggota tim                    |
| **Pengaturan**        | `/orgs/[slug]/settings`             | Profil ruang kerja, koneksi, honor             |

---

## 🔄 Alur Utama

### Alur: Artikel dari Draft ke Publish

```
Kontributor → Tulis artikel → Kirim ke Review
                                        ↓
Reviewer → Review → Approve / Request Revision
                                        ↓
Jika revisi → Kontributor revisi → Kirim ulang → Approve
                                        ↓
Editor → Terbitkan ke WordPress ✅
```

### Alur: Honor & Payout

```
Workspace atur nominal honor per artikel
        ↓
Setiap artikel APPROVED/PUBLISHED → honor terakumulasi
        ↓
Kontributor ajukan payout
        ↓
Finance verifikasi → Approve & bayar (upload bukti transfer)
```

### Alur: Undang Anggota Baru

```
Owner/Editor → Masukkan email + pilih role
        ↓
Sistem kirim email invitation (Better Auth)
        ↓
User klik link → login/signup → otomatis masuk ruang kerja
```

---

## 🧱 Tech Stack

| Lapisan           | Teknologi                                             |
| ----------------- | ----------------------------------------------------- |
| **Backend**       | Bun + ElysiaJS (v1) + Drizzle ORM + PostgreSQL 18     |
| **Frontend**      | Next.js 16 (App Router) + React 19 + Tailwind CSS v4  |
| **UI Components** | shadcn/ui + Lucide Icons                              |
| **Auth**          | Better Auth (email/password + Google OAuth + API key) |
| **Validation**    | TypeBox (backend) + Zod v4 (frontend)                 |
| **Linting**       | Biome (frontend)                                      |

---

## 💰 Model Bisnis (SaaS)

**Saat ini semua workspace menggunakan paket Free.** Tidak ada kartu kredit. Gratis penuh selama masa early access.

| Paket  |     Harga | Anggota | Artikel | Koneksi | AI  |
| ------ | --------: | ------: | ------: | ------: | :-: |
| Free   |       Rp0 |      10 |     100 |       1 | ✅  |
| Mulai  |  Rp49.000 |      10 |     300 |       1 | ✅  |
| Tumbuh | Rp149.000 |      30 |       ∞ |       3 | ✅  |
| Studio | Rp399.000 |     100 |       ∞ |      10 | ✅  |

---

## 🚀 Cara Mulai (Development)

```sh
# Install dependencies
bun install

# Start database
docker compose up db -d

# Jalankan backend + frontend
bun run dev
```

Lihat [PRD.md](./PRD.md) untuk spesifikasi lengkap produk dan [TODO.md](./TODO.md) untuk status implementasi.

---

## 🧠 Visi Ke Depan

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🎯 Kreatur 2026+                              │
│                                                 │
│  "Standar industri manajemen editorial          │
│   untuk organisasi konten di Indonesia"         │
│                                                 │
│  Dari media online, komunitas, agensi,          │
│  hingga brand — semua punya workflow            │
│  editorial profesional dalam satu platform.     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

> **Kreatur** — by [@rasyidly](https://github.com/rasyidly)
>
> _Platform manajemen kontributor & editorial untuk organisasi konten Indonesia._
>
> 🌐 https://kreatur.sekeco.work | 📧 hello@kreatur.sekeco.work | 📱 IG: @kreatur.sekeco.work
