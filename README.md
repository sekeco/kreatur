![Kreatur](https://img.shields.io/badge/Kreatur-Beta-emerald?style=for-the-badge&labelColor=1e293b)

# Kreatur — Platform Manajemen Kontributor & Editorial

**Kreatur** menyatukan proses penulisan, review, persetujuan, pembayaran honor, dan distribusi konten dalam satu ruang kerja — terintegrasi langsung dengan WordPress.

> 🚀 **Dari naskah ke publikasi, rapi dalam satu ruang kerja.**

---

## Masalah yang Dipecahkan

| Masalah                                              | Solusi Kreatur                                           |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Naskah & revisi tersebar di chat, email, Google Docs | Semua naskah terpusat di satu platform                   |
| Status artikel tidak transparan bagi kontributor     | Status real-time: Draf → Review → Setujui/Tolak → Terbit |
| Pembayaran honor sulit direkonsiliasi                | Honor otomatis, payout request + verifikasi              |
| Publikasi ke WordPress masih copy-paste              | Publish 1 klik via REST API                              |

## Fitur Utama

| Fitur                     | Deskripsi                                                                 |
| ------------------------- | ------------------------------------------------------------------------- |
| **Multi-Tenant**          | Setiap organisasi punya ruang kerja sendiri, data terisolasi              |
| **White-label**           | Logo dark/light mode, domain kustom per workspace                         |
| **Foto Profil**           | Unggah avatar pengguna (file upload + URL)                                |
| **Artikel CRUD**          | Rich-text editor (TipTap), auto-save, word count, quality checklist       |
| **Workflow Editorial**    | Draf → Kirim Review → Setujui / Minta Revisi / Tolak → Terbit             |
| **Review System**         | Skor ★ 1-5, catatan, riwayat review, keputusan (setujui/revisi/tolak)     |
| **Dashboard Per Role**    | Widget ringkasan, aktivitas terbaru, artikel perlu tindakan               |
| **WordPress Integration** | Koneksi REST API, publish 1 klik, user sync 2 arah (kontributor)          |
| **Honor & Payout**        | Aturan honor per workspace, pengajuan & verifikasi payout                 |
| **Manajemen Anggota**     | Invite via email/link, 5 role (Owner/Editor/Reviewer/Kontributor/Finance) |
| **Activity Log**          | Audit trail untuk perubahan status, review, payout                        |

## Role dalam Workspace

| Role            | Deskripsi                                    |
| --------------- | -------------------------------------------- |
| **Pemilik**     | Akses penuh ke semua fitur dan pengaturan    |
| **Editor**      | Kelola konten, kategori, workflow, publikasi |
| **Reviewer**    | Nilai naskah, skor, komentar, keputusan      |
| **Kontributor** | Tulis artikel, lihat feedback, ajukan honor  |
| **Finance**     | Verifikasi & payout honor kontributor        |

> **Semua pengguna adalah non-teknis. Aplikasi harus langsung dimengerti tanpa panduan.**  
> Seluruh UI menggunakan **Bahasa Indonesia**.

## Tech Stack

| Lapisan           | Teknologi                                                   |
| ----------------- | ----------------------------------------------------------- |
| **Backend**       | Bun + ElysiaJS (v1) + Drizzle ORM + PostgreSQL 18           |
| **Frontend**      | Next.js 16 (App Router) + React 19 + Tailwind CSS v4        |
| **UI Components** | shadcn/ui + DiceUI + Lucide Icons                           |
| **Auth**          | Better Auth (email/password + Google OAuth + 2FA + API key) |
| **Validation**    | TypeBox (backend) + Zod v4 (frontend)                       |

## Model Bisnis

**Saat ini semua workspace paket Free.** Gratis penuh selama masa early access.

| Paket  |     Harga | Anggota | Artikel | Koneksi |
| ------ | --------: | ------: | ------: | ------: |
| Free   |       Rp0 |      10 |     100 |       1 |
| Mulai  |  Rp49.000 |      10 |     300 |       1 |
| Tumbuh | Rp149.000 |      30 |       ∞ |       3 |
| Studio | Rp399.000 |     100 |       ∞ |      10 |

> ⚠️ Plan belum di-enforce. Semua workspace saat ini paket Free tanpa batasan.

## Cara Mulai (Development)

```sh
bun install                    # Install dependencies
docker compose up db -d        # Start PostgreSQL
bun run db:migrate             # Apply migrations
bun run seed                   # Seed test data (opsional)
bun run dev                    # Jalankan backend + frontend
```

> Lihat [PRD.md](./PRD.md) untuk spesifikasi produk lengkap dan [TODO.md](./TODO.md) untuk task tracker.

## Visi

**"Standar industri manajemen editorial untuk organisasi konten di Indonesia."**  
Dari media online, komunitas, agensi, hingga brand — semua punya workflow editorial profesional dalam satu platform.

---

> **Kreatur** — by [@rasyidly](https://github.com/rasyidly)  
> Platform manajemen kontributor & editorial untuk organisasi konten Indonesia.  
> 🌐 https://kreatur.sekeco.work | 📧 hello@kreatur.sekeco.work
