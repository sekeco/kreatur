import nodemailer from "nodemailer"

export function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured — emails won't be sent")
    return null
  }

  return nodemailer.createTransport({
    debug: true,
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

/** Default sender address from env */
/** Default sender address — format: "Name <email>" or just "email" */
export function getDefaultFrom(): string {
  const raw = process.env.SMTP_FROM
  if (!raw) return "noreply@kreatur.sekeco.work"
  // ponytail: handle "<Name>email" typo — rewrite to "Name <email>"
  const match = raw.match(/^<([^>]+)>([^@]+@[^@]+)$/)
  if (match) return `${match[1]} <${match[2]}>`
  return raw
}
