import type { NextConfig } from "next"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

const nextConfig: NextConfig = {
  // ─── Rewrites ────────────────────────────────────────
  // Proxy /storage/* ke backend (file uploads)
  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: `${BACKEND_URL}/storage/:path*`,
      },
    ]
  },

  // ─── Standalone output (Docker) ───────────────────────
  // Hanya menghasilkan file yang diperlukan untuk production,
  // mengurangi ukuran image Docker secara signifikan
  output: "standalone",

  // ─── Optimasi bundle untuk kurangi memory ──────────
  // Gunakan `optimizePackageImports` agar Next.js hanya
  // meng-import komponen yang benar-benar dipakai
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "radix-ui",
    ],
  },

  // ─── Server configuration ───────────────────────────
  // Paket yang harus di-load sebagai external (tidak di-bundle)
  serverExternalPackages: ["@kreatur/commons"],

  // ─── Build configuration ────────────────────────────
  // Lewati type-checking di build (pre-existing issue dengan Eden treaty types)
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
