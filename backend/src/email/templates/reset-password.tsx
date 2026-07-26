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

interface ResetPasswordProps {
  name: string
  url: string
}

export default function ResetPassword({ name, url }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset kata sandi akun Kreatur Anda</Preview>
      <Body style={kreaturLayout.body}>
        <Container style={kreaturLayout.container}>
          <div style={kreaturLayout.logoWrap}>
            <span
              dangerouslySetInnerHTML={{ __html: kreaturLayout.logoSvg }}
            />
            <span style={kreaturLayout.logoText}>Kreatur</span>
          </div>

          <Section style={kreaturLayout.card}>
            <Text style={kreaturLayout.title}>Reset kata sandi</Text>
            <Text style={kreaturLayout.paragraph}>
              Hai <strong>{name}</strong>,
              <br />
              Kami menerima permintaan reset kata sandi untuk akun Kreatur
              Anda. Klik tombol di bawah untuk membuat kata sandi baru.
            </Text>

            <div style={{ textAlign: "center" as const, marginTop: 32 }}>
              <Button href={url} style={kreaturLayout.button}>
                Reset Kata Sandi
              </Button>
            </div>
          </Section>

          <Text style={kreaturLayout.footerText}>
            Kreatur adalah platform manajemen kontributor & editorial untuk
            organisasi konten Indonesia — dari naskah ke publikasi, rapi dalam
            satu ruang kerja.
          </Text>
          <Text style={kreaturLayout.footerLegal}>
            Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta reset kata
            sandi, abaikan email ini.
            <br />
            &copy; {new Date().getFullYear()} Kreatur.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

ResetPassword.PreviewProps = {
  name: "Budi Santoso",
  url: "https://kreatur.sekeco.work/reset-password?token=xxx",
}
