const STATIC_ORIGINS = [
  process.env.FRONTEND_URL ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:8000",
]

// Custom domains dari environment variable (comma separated)
const CUSTOM_ORIGINS = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const allowedOrigins = new Set([...STATIC_ORIGINS, ...CUSTOM_ORIGINS])

export function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.has(origin)
}
