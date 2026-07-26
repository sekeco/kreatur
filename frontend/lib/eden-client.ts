import { treaty } from "@elysiajs/eden/treaty2"
import type { App } from "@kreatur/backend/src/app"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

export const api = treaty<App>(BACKEND_URL, {
  fetch: { credentials: "include" },
  parseDate: false,
})
