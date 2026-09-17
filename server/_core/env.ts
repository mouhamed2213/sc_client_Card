export const ENV = {
  host: process.env.HOST ?? "http://localhost",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // GOOGLE OAUTH
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Must exactly match an "Authorized redirect URI" configured in Google Cloud Console.
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.HOST ?? "http://localhost:3000"}/api/oauth/callback`,
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // LOCAL ADMIN AUTH
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",

  // STORAGE
  storageEndpoint: process.env.S3_ENDPOINT,
  storageAccessKeyId: process.env.S3_ACCESS_KEY_ID,
  storageSecretKey: process.env.S3_SECRET_ACCESS_KEY,
  publicUrl: process.env.S3_PUBLIC_BASE_URL,
  bucket: process.env.S3_BUCKET_NAME,


  // jwt
  jwt: process.env.JWT_SECRET,
};
