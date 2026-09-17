import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { s3Client, BUCKET_NAME } from "./s3Client";
import { ENV } from "./_core/env";

// En local : SeaweedFS (ex: http://localhost:8333)
// En prod : Supabase (ex: https://<project-ref>.supabase.co/storage/v1/s3)
const isProd = process.env.NODE_ENV === "production";

// may be exported later
const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1", // Ex: 'global' pour Supabase
  endpoint: ENV.storageEndpoint, // http://localhost:8333 (Seaweed) ou URL Supabase
  credentials: {
    accessKeyId: ENV.storageAccessKeyId || "",
    secretAccessKey: ENV.storageSecretKey || "",
  },
  forcePathStyle: true, // Requis pour SeaweedFS et la plupart des S3 auto-hébergés
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "my-bucket";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  // Convertir les données en Buffer/Uint8Array
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    
    await s3Client.send(command);

    // Génération de l'URL publique ou d'accès selon l'environnement
    const publicUrl = process.env.S3_PUBLIC_BASE_URL
      ? `${process.env.S3_PUBLIC_BASE_URL}/${BUCKET_NAME}/${key}`
      : `/${BUCKET_NAME}/${key}`;

    return { key, url: publicUrl };
  } catch (error) {
    console.error("[Storage] S3 Put failed:", error);
    throw new Error(`Storage upload failed: ${String(error)}`);
    
  }
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // Construction de l'URL publique en fonction de la variable d'environnement
  const baseUrl = process.env.S3_PUBLIC_BASE_URL; // Ex: http://localhost:8333 ou Supabase URL
  const publicUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/${BUCKET_NAME}/${key}`
    : `/${BUCKET_NAME}/${key}`;

  return { key, url: publicUrl };
}

