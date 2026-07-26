import * as React from "react"

// ponytail: Inline styles for email compatibility. No Tailwind.
// Colors / typography match the example's dark-on-white aesthetic.

const logo = `<svg width="28" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 41"><path fill-rule="evenodd" clip-rule="evenodd" d="M24.6625 0C29.5499 0.000157557 33.512 3.87456 33.5121 8.65224C33.5121 8.91866 33.4997 9.18398 33.4824 9.44828H40.9366C48.1871 9.44828 51.0342 18.6407 45.0014 22.5723L37.1131 27.7122C35.415 28.8193 35.8805 31.3743 37.8654 31.84C38.5143 31.9921 39.1997 31.8658 39.7475 31.4934L44.3242 28.1927C44.4979 28.0675 44.7074 28 44.9225 28H57.4922C57.9872 28 58.1886 28.6281 57.7838 28.909L44.4783 38.1397C41.99 39.8319 38.8796 40.4048 35.9321 39.7133C26.9186 37.5986 24.8061 26.0015 32.5185 20.9749L37.7818 17.5457H29.7048H24.5358C23.0515 17.5457 21.6504 17.1926 20.4171 16.5691C21.7314 17.4535 24.9805 18.4377 27.7216 18.6251C27.9658 18.6251 28.3625 18.8385 27.8901 19.3183L11.2952 35.7067C11.105 35.8945 10.847 36 10.578 36H0.507884C0.056246 36 -0.169872 35.4613 0.149574 35.1463L19.5219 16.0472C17.1349 14.4709 15.5652 11.8013 15.5649 8.77349C15.5649 3.92875 19.5825 0 24.5385 0H24.6625ZM24.8419 6.74915C23.6982 6.74915 22.771 7.35337 22.771 8.09871C22.7715 8.71319 23.4024 9.23009 24.2648 9.39292C24.3487 9.42847 24.4413 9.44828 24.5385 9.44828H25.1533C25.1544 9.44225 25.1535 9.43586 25.1546 9.42983C26.1495 9.33152 26.9122 8.77441 26.9127 8.09871C26.9127 7.35337 25.9855 6.74915 24.8419 6.74915Z" fill="#1f2222"/></svg>`

export const kreaturLayout = {
  logoSvg: logo,

  body: {
    margin: 0,
    padding: "8px",
    backgroundColor: "#f2f2f2",
    fontFamily: "Geist, Inter, system-ui, sans-serif",
  } as React.CSSProperties,

  container: {
    maxWidth: 640,
    margin: "0 auto",
  } as React.CSSProperties,

  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
    paddingTop: 56,
  } as React.CSSProperties,

  logoText: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#1f2222",
  } as React.CSSProperties,

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 0,
    padding: "56px 24px 72px",
    textAlign: "center" as const,
  } as React.CSSProperties,

  title: {
    margin: 0,
    fontSize: 40,
    fontWeight: 500,
    color: "#1f2222",
    lineHeight: "48px",
  } as React.CSSProperties,

  paragraph: {
    margin: "24px 0 0",
    fontSize: 14,
    lineHeight: "20px",
    color: "#6b7280",
  } as React.CSSProperties,

  button: {
    display: "inline-block",
    padding: "12px 20px",
    fontSize: 15,
    lineHeight: "20px",
    color: "#1f2222",
    textDecoration: "none",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
  } as React.CSSProperties,

  footerText: {
    margin: "80px 24px 0",
    fontSize: 13,
    lineHeight: "18px",
    color: "#6b7280",
    textAlign: "center" as const,
  } as React.CSSProperties,

  footerLegal: {
    margin: "20px 24px 0",
    fontSize: 11,
    lineHeight: "16px",
    color: "#6b7280",
    textAlign: "center" as const,
    paddingBottom: 56,
  } as React.CSSProperties,
}
