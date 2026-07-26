import * as React from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { kreaturLayout } from "./shared"

interface ArticleReviewProps {
  authorName: string
  articleTitle: string
  decision: "APPROVED" | "REVISION_REQUESTED"
  score?: number
  notes?: string
  articleUrl: string
}

export default function ArticleReview({
  authorName,
  articleTitle,
  decision,
  score,
  notes,
  articleUrl,
}: ArticleReviewProps) {
  const decisionLabel =
    decision === "APPROVED" ? "Disetujui" : "Perlu Revisi"

  return (
    <Html>
      <Head />
      <Preview>Artikel Anda telah di-review di Kreatur</Preview>
      <Body style={kreaturLayout.body}>
        <Container style={kreaturLayout.container}>
          <div style={kreaturLayout.logoWrap}>
            <span
              dangerouslySetInnerHTML={{ __html: kreaturLayout.logoSvg }}
            />
            <span style={kreaturLayout.logoText}>Kreatur</span>
          </div>

          <Section style={kreaturLayout.card}>
            <Text style={kreaturLayout.title}>Artikel telah di-review</Text>
            <Text style={kreaturLayout.paragraph}>
              Hai <strong>{authorName}</strong>,
              <br />
              Artikel{" "}
              <strong>{articleTitle}</strong> telah selesai di-review dengan
              keputusan <strong>{decisionLabel}</strong>.
            </Text>

            {score !== undefined && (
              <Text style={kreaturLayout.paragraph}>
                Skor: <strong>{score}</strong>
              </Text>
            )}

            {notes && (
              <Text style={kreaturLayout.paragraph}>
                Catatan reviewer:
                <br />
                {notes}
              </Text>
            )}

            <div style={{ textAlign: "center" as const, marginTop: 32 }}>
              <Button href={articleUrl} style={kreaturLayout.button}>
                Lihat Artikel
              </Button>
            </div>
          </Section>

          <Text style={kreaturLayout.footerText}>
            Kreatur adalah platform manajemen kontributor & editorial untuk
            organisasi konten Indonesia — dari naskah ke publikasi, rapi dalam
            satu ruang kerja.
          </Text>
          <Text style={kreaturLayout.footerLegal}>
            &copy; {new Date().getFullYear()} Kreatur.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

ArticleReview.PreviewProps = {
  authorName: "Budi Santoso",
  articleTitle: "Mengenal Ekosistem Startup di Indonesia",
  decision: "APPROVED" as const,
  score: 85,
  notes:
    "Artikel sangat informatif dan ditulis dengan gaya yang mudah dipahami. Perhatikan ejaan pada paragraf ke-3 untuk konsistensi bahasa.",
  articleUrl: "https://kreatur.sekeco.work/orgs/media-onlineku/articles/abc123",
}
