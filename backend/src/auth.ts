import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { twoFactor } from "better-auth/plugins/two-factor"
import { zenstackAdapter } from "@zenstackhq/better-auth"
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendInvitationEmail,
} from "./email"
import { db } from "./db/client"

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000"

export const auth = betterAuth({
  appName: "Kreatur",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  database: zenstackAdapter(db, { provider: "postgresql" }),
  trustedOrigins: [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8000",
    ...(process.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, user.name, url)
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const callbackUrl = `${FRONTEND_URL}/auth/verify-email`
      const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:8000"
      const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(callbackUrl)}`
      await sendVerificationEmail(user.email, user.name, verifyUrl)
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // refresh tiap 24 jam
    cookieCache: {
      maxAge: 60 * 5, // cache 5 menit
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: false,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // trustedProviders: ["google"], // hanya provider tertentu bisa auto-link
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      membershipLimit: 10,
      creatorRole: "owner",
      defaultOrganizationIdField: "slug",
      invitationExpiresIn: 60 * 60 * 24 * 7,
      invitationLimit: 50,
      sendInvitationEmail: async ({ email, organization: org, inviter, invitation }) => {
        const url = `${FRONTEND_URL}/join/${org.slug}?invitationId=${invitation.id}`
        await sendInvitationEmail(email, org.name, inviter.user.name, url)
      },
    }),
    twoFactor({
      issuer: "Kreatur",
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: "encrypted",
      },
    }),
  ],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
    disableOriginCheck: true, // ponytail: dev only
  },
})
