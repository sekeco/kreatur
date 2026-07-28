# ✅ TODO — Kreatur Production Beta

> **Tujuan:** Aplikasi siap production dengan workflow editorial yang stabil, UX yang ramah untuk pengguna non-teknis, dan fondasi yang scalable.
>
> **Dokumen terkait:** [`PRD.md`](./PRD.md) — Spesifikasi produk lengkap.
>
> Last updated: 27 Juli 2026

---

## 🟡 Sprint 1 — Stabilkan Workflow Editorial (Estimasi: 5-7 hari)

Blocker yang membuat workflow editorial tidak bisa berfungsi end-to-end. Prioritas mutlak.

| #   | Task                                                                                                                                                                                  | Area               | File / Komponen                                                            | Estimasi |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------- | -------- |
| 1   | **Fix: Kontributor bisa edit artikel `REVISION_REQUESTED`** — ubah `canEdit` dari `isDraft` saja menjadi `isDraft \|\| isRevisionRequested`                                           | Frontend           | `app/orgs/[slug]/articles/[id]/page.tsx`                                   | 1 jam    |
| 2   | **Tambah opsi "Tolak" (REJECTED)** di halaman review — mapping decision + alasan wajib jika tolak                                                                                     | Frontend           | `app/orgs/[slug]/articles/[id]/review/page.tsx`                            | 3 jam    |
| 3   | **Auto-assign reviewer default** — saat submit, artikel otomatis di-assign ke `default_reviewer_id` workspace (Owner sebagai default). Kontributor tidak perlu/dapat memilih reviewer | Backend + Frontend | `backend/src/modules/articles/`, `submit` handler                          | 3 jam    |
| 4   | **Tambah pengaturan default reviewer di Settings** — halaman settings workspace punya field untuk Owner memilih default reviewer. Hanya Owner yang bisa mengubahnya                   | Frontend           | `app/orgs/[slug]/settings/_components/honor-section.tsx` atau section baru | 4 jam    |
| 5   | **Tambah confirmation dialog** untuk submit, approve, reject, hapus artikel (PRD Design Principle 4.4)                                                                                | Frontend           | `articles-columns.tsx`, `review/page.tsx`                                  | 4 jam    |
| 6   | **Tambah confirmation dialog** untuk hapus kategori — peringatan jika masih memiliki artikel                                                                                          | Frontend           | `app/orgs/[slug]/categories/page.tsx`                                      | 2 jam    |

> **Definition of Done:** Owner bisa bikin workflow lengkap: Kontributor tulis → submit ke reviewer → reviewer setujui/tolak → kontributor revisi → submit ulang → approve → publish.

---

## 🟢 Sprint 2 — Production Hardening (Estimasi: 7-10 hari)

Fitur yang mencegah kehilangan data, meningkatkan kepercayaan, dan membuat aplikasi terasa profesional.

### 2.1 Data Safety

| #   | Task                                                                                 | Area     | Detail                          | Estimasi |
| --- | ------------------------------------------------------------------------------------ | -------- | ------------------------------- | -------- |
| 7   | **Auto-save draft** — simpan otomatis tiap 60 detik saat ada perubahan (`isDirty`)   | Frontend | `new/page.tsx`, `[id]/page.tsx` | 2 hari   |
| 8   | **Indikator status save** — tampilkan "Menyimpan...", "Tersimpan", "Gagal menyimpan" | Frontend | Sama seperti #7                 | 1 hari   |
| 9   | **`beforeunload` guard** — peringatan jika ada perubahan belum disimpan              | Frontend | `new/page.tsx`, `[id]/page.tsx` | 3 jam    |

### 2.2 User Activation & First Experience

| #   | Task                                                                                                                                                                                                                              | Area     | Detail                                    | Estimasi |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------- | -------- |
| 10  | **Landing page `/`** — Hero section: headline, value proposition, CTA "Mulai Sekarang"                                                                                                                                            | Frontend | `app/page.tsx`                            | 1 hari   |
| 11  | **Empty states** — "Belum ada artikel. Buat artikel pertama!" + tombol CTA                                                                                                                                                        | Frontend | `articles/page.tsx`, `dashboard/page.tsx` | 1 hari   |
| 12  | **Label status Bahasa Indonesia** — `DRAFT` → "Draf", `PENDING_REVIEW` → "Menunggu Review", `REVISION_REQUESTED` → "Perlu Revisi", `APPROVED` → "Disetujui", `REJECTED` → "Ditolak", `PUBLISHED` → "Terbit", `ARCHIVED` → "Arsip" | Frontend | `article-data.ts` + semua consumer        | 1 hari   |
| 13  | **Button label Bahasa Indonesia** — "Kirim ke Reviewer" (bukan "Submit"), "Setujui" (bukan "Approve"), dll                                                                                                                        | Frontend | Semua file                                | 3 jam    |

### 2.3 Security & Reliability

| #   | Task                                                                                 | Area     | Detail                                  | Estimasi |
| --- | ------------------------------------------------------------------------------------ | -------- | --------------------------------------- | -------- |
| 14  | **Tambah Error Boundary** — cegah white screen, tampilkan fallback UI                | Frontend | `app/layout.tsx` atau komponen baru     | 3 jam    |
| 15  | **Sembunyikan tombol Ekspor + checkbox seleksi** dari UI (belum siap)                | Frontend | `articles/page.tsx`, `payouts/page.tsx` | 1 jam    |
| 16  | **Validasi cover image URL** — terima relative path dan absolute path tanpa protocol | Frontend | `new/page.tsx`, `[id]/page.tsx`         | 1 jam    |

---

## 🔵 Sprint 3 — Enhancement UX (Estimasi: 10-14 hari)

Perbaikan yang membuat aplikasi nyaman dipakai sehari-hari oleh semua role.

### 3.1 Konsistensi & Navigasi

| #   | Task                                                                                                                                       | Detail | Estimasi |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------- |
| 17  | **Star rating DiceUI ★ 1-5** — ganti input numeric 0-100 dengan komponen Rating                                                            | 1 hari |
| 18  | **Update Roles page** — konsistenkan skor (1-5), update permission descriptions                                                            | 2 jam  |
| 19  | **Breadcrumb navigation** — `Artikel > [Judul]`, `Artikel > [Judul] > Review`, `Settings > Honor`                                          | 1 hari |
| 20  | **Standardisasi search pattern** — pilih dan terapkan 1 pola (debounce 300ms)                                                              | 2 jam  |
| 21  | **Auto-publish threshold jelas** — tampilkan ke reviewer "Skor >= N → otomatis approve". Nilai N diatur di Settings workspace (default: 4) | 3 jam  |
| 21b | **Tambah pengaturan default approve score di Settings** — Owner bisa mengatur skor minimum untuk auto-approve di pengaturan workspace      | 4 jam  |

### 3.2 Payout & Finance

| #   | Task                                                                                                      | Detail | Estimasi |
| --- | --------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 22  | **Transparansi eligible articles** — tampilkan breakdown per artikel yang eligible untuk payout           | 1 hari |
| 23  | **Flow input bank account lebih jelas** — pastikan kontributor bisa input rekening sebelum payout pertama | 1 hari |

### 3.3 Kualitas Konten

| #   | Task                                                                                                                           | Detail | Estimasi |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | -------- |
| 24  | **Tambah preview artikel** — mode read-only sebelum submit/publish, bisa juga via TipTap read-only                             | 2 hari |
| 25  | **Word count 500-1000 jadi soft guideline** — tampilkan sebagai saran, bukan hard requirement, atau configurable per workspace | 3 jam  |
| 26  | **Update seed data** — minimal 2 workspace, 10+ user multi-role, 20+ artikel multi-status untuk testing                        | 1 hari |

### 3.4 Code Hygiene

| #   | Task                                                                                                | Detail   | Estimasi |
| --- | --------------------------------------------------------------------------------------------------- | -------- | -------- |
| 27  | **Refactor role normalization** — buat shared utility `normalizeRole()`, hapus duplikasi di 6+ file | 1 jam    |
| 28  | **Hapus import dummy data** yang tidak terpakai di production                                       | 30 menit |
| 29  | **Hapus state mati** — `confirmAction` tidak terpakai di `articles-columns.tsx`                     | 15 menit |
| 30  | **Buat shared types** — ganti `any` dengan tipe yang tepat untuk Article, Category, Event, Member   | 3 jam    |
| 31  | **Standardisasi error handling** — buat helper `handleApiError()`                                   | 1 jam    |

---

## 🟣 Sprint 4 — Post-Beta Features (Estimasi: 20-30 hari)

Fitur tambahan yang penting tapi tidak blocking untuk rilis beta.

### 4.1 WordPress & Integrasi

| #   | Task                                                                                         | Detail   | Estimasi |
| --- | -------------------------------------------------------------------------------------------- | -------- | -------- |
| 32  | **WordPress user sync UI** — Sync Now, import WP users (khusus role kontributor), push ke WP | 5-7 hari |
| 33  | **Sync log** — riwayat sinkronisasi user di halaman connections                              | 2 hari   |

### 4.2 Notifikasi & Komunikasi

| #   | Task                                                                                       | Detail | Estimasi |
| --- | ------------------------------------------------------------------------------------------ | ------ | -------- |
| 34  | **Notifikasi email** — review selesai, payout approved/rejected, invitation                | 5 hari |
| 35  | **"Tarik dari Review"** — kontributor bisa menarik artikel yang sudah di-submit (PRD spec) | 1 hari |

### 4.3 Laporan & Admin

| #   | Task                                                                                                         | Detail   | Estimasi |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| 36  | **Laporan & Audit** — fitur khusus pengganti export: rekap honor per periode, aktivitas per user, export CSV | 5-7 hari |
| 37  | **Plan enforcement** — integrasikan `plan.json`, batasi anggota/artikel/koneksi berdasarkan paket            | 5 hari   |

### 4.4 Fitur Lanjutan

| #   | Task                                                                                  | Detail | Estimasi |
| --- | ------------------------------------------------------------------------------------- | ------ | -------- |
| 38  | **Generated types dari Eden Treaty** — type safety penuh, ganti semua `any`           | 2 hari |
| 39  | **Optimistic UI** — respon instan untuk save/update, rollback on error                | 2 hari |
| 40  | ~~**Dark mode**~~ ✅ **Selesai**                                                      | 2 hari |
| 41  | **Search (PostgreSQL FTS)** — pencarian artikel yang lebih advanced                   | 3 hari |
| 42  | **Slug bisa diedit manual** — sesuai PRD spec                                         | 1 hari |
| 43  | **Excerpt field** — tambah field ringkasan di form artikel (PRD spec)                 | 1 hari |
| 44  | **Analytics / monitoring** — setup PostHog atau Vercel Analytics untuk tracking usage | 1 hari |

---

## 🧹 Operational (Non-Feature)

Task yang tidak mengubah kode tapi penting untuk operasional produk.

| #   | Task                                                                                            | Detail | Estimasi |
| --- | ----------------------------------------------------------------------------------------------- | ------ | -------- |
| 45  | **Buat CHANGELOG.md** — catat perubahan per rilis                                               | 1 jam  |
| 46  | **Setup error monitoring** — Sentry atau alternatif                                             | 1 hari |
| 47  | **Load testing** — berapa banyak artikel/user yang bisa di-handle sebelum slowdown              | 2 hari |
| 48  | **Dependency audit** — `bun audit` atau Dependabot                                              | 1 hari |
| 49  | **User documentation / help center** — minimal panduan singkat untuk setiap role                | 3 hari |
| 50  | **User testing** — tes dengan 3-5 user sungguhan (1 owner, 1 editor, 1 reviewer, 2 kontributor) | 3 hari |

---

## Ringkasan Timeline

| Sprint          | Fokus                        | Task      | Estimasi   |
| --------------- | ---------------------------- | --------- | ---------- |
| **Sprint 1** 🟡 | Stabilkan workflow editorial | #1 - #6   | 5-7 hari   |
| **Sprint 2** 🟢 | Production hardening         | #7 - #16  | 7-10 hari  |
| **Sprint 3** 🔵 | Enhancement UX               | #17 - #31 | 10-14 hari |
| **Sprint 4** 🟣 | Post-beta features           | #32 - #44 | 20-30 hari |
| **Ops** 🧹      | Operational                  | #45 - #50 | 10-12 hari |

> **Target rilis production:** Setelah Sprint 1 + 2 selesai (approx 3 minggu), aplikasi sudah cukup stabil untuk production.
>
> Sprint 3-4 dan Ops bisa berjalan paralel setelah rilis.

## Referensi Cepat

| Dokumen                    | Isi                                                          |
| -------------------------- | ------------------------------------------------------------ |
| [`PRD.md`](./PRD.md)       | Spesifikasi produk lengkap — desain, flow, prioritas         |
| [`AGENTS.md`](./AGENTS.md) | Panduan untuk AI coding agent — struktur, konvensi, perintah |
| [`README.md`](./README.md) | Untuk publik — value proposition, tech stack, cara mulai     |
