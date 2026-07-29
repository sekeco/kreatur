import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { ok, fail } from "../../lib/response"

// UPLOAD_DIR:
//   - env: absolute di Docker (/app/storage) atau relative ke CWD backend/ (../storage)
//   - default: "../storage" = root storage/ (dari CWD backend/)
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "../storage"

/**
 * Upload router — handles file uploads for avatars, logos, etc.
 * Files are stored in UPLOAD_DIR and served via /storage/*
 * Di production, Nginx melayani file langsung dari /storage/
 */
export const uploadRouter = new Elysia()
  .use(authGuard)

  // ─── POST /api/upload/avatar — upload user avatar ──────────
  .post("/api/upload/avatar", async ({ user, body }) => {
    try {
      const file = body.file
      const ext = file.name.split(".").pop() ?? "png"
      const filename = `avatar-${user.id}-${Date.now()}.${ext}`
      const filepath = `${UPLOAD_DIR}/avatars/${filename}`

      await Bun.write(filepath, file)

      const url = `/storage/avatars/${filename}`
      return ok({ url })
    } catch (e: any) {
      return fail(e.message ?? "Gagal mengunggah avatar")
    }
  }, {
    auth: true,
    body: t.Object({
      file: t.File({ type: "image", maxSize: "5m" }),
    }),
  })

  // ─── POST /api/upload/logo — upload workspace logo ──────────
  .post("/api/upload/logo", async ({ user, body }) => {
    try {
      const file = body.file
      const ext = file.name.split(".").pop() ?? "png"
      const filename = `logo-${user.id}-${Date.now()}.${ext}`
      const filepath = `${UPLOAD_DIR}/logos/${filename}`

      await Bun.write(filepath, file)

      const url = `/storage/logos/${filename}`
      return ok({ url })
    } catch (e: any) {
      return fail(e.message ?? "Gagal mengunggah logo")
    }
  }, {
    auth: true,
    body: t.Object({
      file: t.File({ maxSize: "512k" }),
    }),
  })
