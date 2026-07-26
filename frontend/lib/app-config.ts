import packageJson from "../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Kreatur",
  tagline: "Platform Manajemen Kontributor & Editorial",
  version: packageJson.version,
  copyright: `© ${currentYear} Kreatur.`,

  links: {
    signin: "/auth/signin",
    signup: "/auth/signup",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
  },
};
