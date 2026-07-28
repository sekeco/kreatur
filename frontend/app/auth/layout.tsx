import type { ReactNode } from "react"

import { Command } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { APP_CONFIG } from "@/lib/app-config"
import { LogoWithText } from "@/components/logo/kreatur"

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh grid-cols-1 justify-center p-2 lg:grid-cols-2">
        {/* Brand Panel — Desktop */}
        <div className="relative order-2 hidden h-full rounded-3xl bg-muted lg:flex">
          <div className="absolute top-10 space-y-4 px-4 lg:px-10">
            <LogoWithText
              size={32}
              className="gap-4 text-3xl [&>span]:font-normal!"
            />
            <p className="text-sm text-muted-foreground">
              {APP_CONFIG.tagline}
            </p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-4 lg:px-10">
            <div className="flex-1 space-y-1">
              <h2 className="font-medium">Kelola konten lebih mudah</h2>
              <p className="text-sm">
                Dari naskah ke publikasi, rapi dalam satu ruang kerja.
              </p>
            </div>
            <Separator
              orientation="vertical"
              className="mx-3 h-auto! bg-primary/10"
            />
            <div className="flex-1 space-y-1">
              <h2 className="font-medium">Ada masalah?</h2>
              <p className="text-sm">
                Hubungi tim dukungan kami, siap membantu 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="relative order-1 flex h-full w-full max-lg:col-span-2">
          {children}
        </div>
      </div>
    </main>
  )
}
