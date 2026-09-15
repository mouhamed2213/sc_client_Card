export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  host: process.env.HOST ?? "http://localhost",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // STORAGE
  storageEndpoint: process.env.S3_ENDPOINT,
  storageAccessKeyId: process.env.S3_ACCESS_KEY_ID,
  storageSecretKey: process.env.S3_SECRET_ACCESS_KEY,
  publicUrl: process.env.S3_PUBLIC_BASE_URL,
  bucket: process.env.S3_BUCKET_NAME,

  // admin Login
  adminUserName: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,

  // jwt
  jwt: process.env.JWT_SECRET,
};
