import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Kreatur</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth/signin">Masuk</Link>
          </Button>
          <Button asChild>
            <Link href="/boarding">Mulai Sekarang</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Kelola Kontributor & Editorial{" "}
            <span className="text-primary">dalam Satu Ruang Kerja</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Kreatur menyatukan penulisan, review, persetujuan, pembayaran honor,
            dan distribusi konten — terintegrasi langsung dengan WordPress.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/boarding">Mulai Sekarang</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin">Masuk</Link>
            </Button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Alur Editorial</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Dari draft hingga publikasi dalam satu alur kerja yang jelas dan
              transparan.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Manajemen Honor</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Atur honor kontributor secara otomatis dengan sistem payout yang
              terintegrasi.
            </p>
          </div>
          <div className="rounded-lg border p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold">Integrasi WordPress</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publikasi artikel langsung ke WordPress dalam satu klik.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Kreatur. All rights reserved.
      </footer>
    </div>
  )
}
