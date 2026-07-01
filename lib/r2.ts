import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible. All presigning happens server-side, so these
// credentials never reach the browser.
export function r2() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export const R2_BUCKET = process.env.R2_BUCKET!;
