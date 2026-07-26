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

interface InvitationProps {
  orgName: string
  inviterName: string
  url: string
}

export default function Invitation({ orgName, inviterName, url }: InvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>Undangan bergabung ke {orgName} di Kreatur</Preview>
      <Body style={kreaturLayout.body}>
        <Container style={kreaturLayout.container}>
          <div style={kreaturLayout.logoWrap}>
            <span
              dangerouslySetInnerHTML={{ __html: kreaturLayout.logoSvg }}
            />
            <span style={kreaturLayout.logoText}>Kreatur</span>
          </div>

          <Section style={kreaturLayout.card}>
            <Text style={kreaturLayout.title}>Undangan bergabung</Text>
            <Text style={kreaturLayout.paragraph}>
              Hai,
              <br />
              <strong>{inviterName}</strong> mengundang Anda untuk bergabung ke
              ruang kerja <strong>{orgName}</strong> di Kreatur.
            </Text>

            <div style={{ textAlign: "center" as const, marginTop: 32 }}>
              <Button href={url} style={kreaturLayout.button}>
                Terima Undangan
              </Button>
            </div>
          </Section>

          <Text style={kreaturLayout.footerText}>
            Kreatur adalah platform manajemen kontributor & editorial untuk
            organisasi konten Indonesia — dari naskah ke publikasi, rapi dalam
            satu ruang kerja.
          </Text>
          <Text style={kreaturLayout.footerLegal}>
            Undangan ini berlaku selama 7 hari. Jika Anda tidak memiliki akun
            Kreatur, Anda akan diminta membuatnya terlebih dahulu.
            <br />
            &copy; {new Date().getFullYear()} Kreatur.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

Invitation.PreviewProps = {
  orgName: "Media OnlineKu",
  inviterName: "Rina Wijaya",
  url: "https://kreatur.sekeco.work/join/media-onlineku?invitation=xxx",
}
