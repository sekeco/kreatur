import { renderToStaticMarkup } from "react-dom/server"
import { createTransporter, getDefaultFrom } from "./transporter"
import VerifyEmail from "./templates/verify-email"
import ResetPassword from "./templates/reset-password"
import Invitation from "./templates/invitation"
import ArticleReview from "./templates/article-review"

// ─── Transporter (lazy) ───────────────────────────────────

let _transporter: ReturnType<typeof createTransporter> | null = null
function getTransporter() {
  if (_transporter === null) _transporter = createTransporter()
  return _transporter
}

// ─── Helpers ──────────────────────────────────────────────

function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter()
  if (!t) {
    console.warn(`[email] SMTP not configured, skipping "${subject}" to ${to}`)
    return
  }
  return t.sendMail({
    from: getDefaultFrom(),
    to,
    subject,
    html: `<!DOCTYPE html>${html}`,
  })
}

// ─── Public API ──────────────────────────────────────────

/** Kirim email verifikasi */
export async function sendVerificationEmail(
  to: string,
  name: string,
  url: string,
) {
  const html = renderToStaticMarkup(<VerifyEmail name={name} url={url} />)
  return sendMail(to, "Verifikasi email Kreatur", html)
}

/** Kirim email reset kata sandi */
export async function sendResetPasswordEmail(
  to: string,
  name: string,
  url: string,
) {
  const html = renderToStaticMarkup(<ResetPassword name={name} url={url} />)
  return sendMail(to, "Reset kata sandi Kreatur", html)
}

/** Kirim undangan bergabung ke organisasi */
export async function sendInvitationEmail(
  to: string,
  orgName: string,
  inviterName: string,
  url: string,
) {
  const html = renderToStaticMarkup(
    <Invitation orgName={orgName} inviterName={inviterName} url={url} />,
  )
  return sendMail(to, `Bergabung ke ${orgName} di Kreatur`, html)
}

/** Kirim email notifikasi review artikel */
export async function sendArticleReviewEmail(
  to: string,
  authorName: string,
  articleTitle: string,
  decision: "APPROVED" | "REVISION_REQUESTED",
  articleUrl: string,
  score?: number,
  notes?: string,
) {
  const html = renderToStaticMarkup(
    <ArticleReview
      authorName={authorName}
      articleTitle={articleTitle}
      decision={decision}
      score={score}
      notes={notes}
      articleUrl={articleUrl}
    />,
  )
  const label = decision === "APPROVED" ? "disetujui" : "perlu revisi"
  return sendMail(to, `Artikel "${articleTitle}" telah ${label}`, html)
}
