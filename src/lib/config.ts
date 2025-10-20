import dotenv from "dotenv";

dotenv.config({
  quiet: true
});

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  mongoURI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gdgoc_uam",
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
  },
  sessionSecret: process.env.SESSION_SECRET || "default_key",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "https://gdguam.es",
  siteURL: process.env.SITE_URL || "https://gdguam.es",
  featureFlagsExportKey: process.env.FEATURE_FLAGS_EXPORT_KEY || "",
  brevoKey: process.env.BREVO_KEY || "",
  associationEmail: process.env.ASSOCIATION_EMAIL || "gdguam@gmail.com"
};

export const {
  port,
  mongoURI,
  google,
  sessionSecret,
  baseURL,
  siteURL,
  featureFlagsExportKey,
  associationEmail
} = config;

export default config;
