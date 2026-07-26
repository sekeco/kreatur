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

interface VerifyEmailProps {
  name: string
  url: string
}

export default function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verifikasi alamat email Anda di Kreatur</Preview>
      <Body style={kreaturLayout.body}>
        <Container style={kreaturLayout.container}>
          {/* Logo */}
          <div style={kreaturLayout.logoWrap}>
            <span
              dangerouslySetInnerHTML={{ __html: kreaturLayout.logoSvg }}
            />
            <span style={kreaturLayout.logoText}>Kreatur</span>
          </div>

          {/* Card */}
          <Section style={kreaturLayout.card}>
            <Text style={kreaturLayout.title}>Verifikasi email</Text>
            <Text style={kreaturLayout.paragraph}>
              Hai <strong>{name}</strong>,
              <br />
              Terima kasih telah mendaftar di Kreatur. Silakan konfirmasi
              alamat email Anda dengan mengklik tombol di bawah ini.
            </Text>

            <div style={{ textAlign: "center" as const, marginTop: 32 }}>
              <Button href={url} style={kreaturLayout.button}>
                Verifikasi Email
              </Button>
            </div>
          </Section>

          {/* Footer */}
          <Text style={kreaturLayout.footerText}>
            Kreatur adalah platform manajemen kontributor & editorial untuk
            organisasi konten Indonesia — dari naskah ke publikasi, rapi dalam
            satu ruang kerja.
          </Text>
          <Text style={kreaturLayout.footerLegal}>
            &copy; {new Date().getFullYear()} Kreatur.
            <br />
            Jika Anda tidak mendaftar akun ini, abaikan email ini.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

VerifyEmail.PreviewProps = {
  name: "Budi Santoso",
  url: "https://kreatur.sekeco.work/verify-email?token=xxx",
}
