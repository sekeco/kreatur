import { Elysia } from "elysia"
import { auth } from "../auth"

/**
 * Better Auth Elysia plugin — mount handler.
 * Auth macros ada di auth-guard.ts
 */
export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
