import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { authGuard } from "./modules/auth-guard"
import { betterAuthPlugin } from "./modules/auth-plugin"
import { isOriginAllowed } from "./lib/cors-origins"
import { connectionsRouter } from "./modules/connections"
import { articlesRouter } from "./modules/articles"
import { categoriesRouter } from "./modules/categories"
import { membersRouter } from "./modules/members"
import { dashboardRouter } from "./modules/dashboard"
import { payoutsRouter } from "./modules/payouts"
import { settingsRouter } from "./modules/settings"
import { profileRouter } from "./modules/profile"
import { uploadRouter } from "./modules/upload"

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000"

// STORAGE_DIR: sama dengan UPLOAD_DIR
// env: absolute di Docker (/app/storage) atau relative ke CWD backend/ (../storage)
// default: "../storage" = root storage/ (dari CWD backend/)
const STORAGE_DIR = process.env.UPLOAD_DIR ?? "../storage"

export const app = new Elysia()
  .use(cors({
    origin: (request: Request) => {
      const origin = request.headers.get("origin")
      if (!origin) return false
      return isOriginAllowed(origin)
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }))
  .use(betterAuthPlugin)
  .use(authGuard)
  .get("/", () => ({ name: "Kreatur API", version: "1.0.0", status: "ok" }))
  .get("/api/health", () => ({ status: "ok" }))
  .use(connectionsRouter)
  .use(articlesRouter)
  .use(categoriesRouter)
  .use(membersRouter)
  .use(dashboardRouter)
  .use(payoutsRouter)
  .use(settingsRouter)
  .use(profileRouter)
  .use(uploadRouter)

  // Serve uploaded files (fallback when nginx tidak digunakan)
  .get("/storage/*", async ({ request }) => {
    const url = new URL(request.url)
    const filename = url.pathname.replace("/storage/", "")
    const filepath = `${STORAGE_DIR}/${filename}`
    const file = Bun.file(filepath)
    const exists = await file.exists()
    if (!exists) return new Response("Not Found", { status: 404 })

    // Set Content-Type berdasarkan ekstensi file
    const ext = filename.split(".").pop()?.toLowerCase() ?? ""
    const mime: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    }
    const contentType = mime[ext] ?? "application/octet-stream"

    return new Response(file, {
      headers: { "Content-Type": contentType },
    })
  })

export type App = typeof app
