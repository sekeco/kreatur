"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export const Kreatur: React.FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 443.32 443.32"
      fill="currentColor"
      {...props}
    >
      <rect x="295.55" width="147.77" height="147.77" />
      <polygon points="147.78 147.78 147.78 0 0 0 0 147.78 0 295.55 0 443.32 147.78 443.32 147.78 295.55 295.55 295.55 295.55 147.78 147.78 147.78" />
      <rect x="295.55" y="295.55" width="147.77" height="147.77" />
    </svg>
  )
}

interface LogoWithTextProps extends IconProps {
  logoDark?: string | null
  logoLight?: string | null
}

/**
 * Kreatur dengan teks "Kreatur" di sampingnya.
 * Mendukung white-label: menampilkan logo kustom berdasarkan tema (dark/light).
 * Jika logo tidak tersedia atau gagal di-load, fallback ke logo default Kreatur.
 */
export function LogoWithText({
  className,
  logoDark,
  logoLight,
  ...props
}: LogoWithTextProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [imgError, setImgError] = React.useState(false)

  // Tentukan logo mana yang akan ditampilkan
  const customLogo = isDark ? logoDark : logoLight

  // Reset error state ketika customLogo berubah
  const prevLogo = React.useRef(customLogo)
  if (prevLogo.current !== customLogo) {
    prevLogo.current = customLogo
    setImgError(false)
  }

  // Jika ada logo kustom dan belum error, tampilkan gambar
  if (customLogo && !imgError) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customLogo}
          alt="Logo"
          className="h-6 w-auto object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback ke logo default Kreatur
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Kreatur {...props} />
      <span className={cn("font-semibold tracking-tight")}>Kreatur</span>
    </div>
  )
}
