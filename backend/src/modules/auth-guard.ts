import { Elysia } from "elysia"
import { auth } from "../auth"

/**
 * Auth guard — plugin untuk verifikasi session + org membership per route.
 *
 * Gunakan via macro `auth` atau `authOrg`:
 *   app.use(authGuard)
 *   .get("/route", handler, { auth: true })          // butuh session
 *   .get("/route", handler, { authOrg: true })       // butuh session + org member
 */
export const authGuard = new Elysia({ name: "auth-guard" })
  .macro({
    auth: {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({
          headers: Object.fromEntries(headers),
        })
        if (!session) return status(401)
        return { user: session.user, session: session.session }
      },
    },
    authOrg: {
      async resolve({ request: { headers }, params, status }) {
        const slug = (params as { slug?: string }).slug
        if (!slug) return status(400)

        const session = await auth.api.getSession({
          headers: Object.fromEntries(headers),
        })
        if (!session) return status(401)

        // listOrganizations hanya mengembalikan org milik user,
        // jadi membership sudah terverifikasi secara implisit
        const headersObj = Object.fromEntries(headers)
        const orgs = await auth.api.listOrganizations({ headers: headersObj })
        const org = orgs.find((o) => o.slug === slug)
        if (!org) return status(404)

        return {
          user: session.user,
          session: session.session,
          organization: org,
        }
      },
    },
  })
