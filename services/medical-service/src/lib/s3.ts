import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.S3_BUCKET_NAME as string;
const region = process.env.AWS_REGION as string;
export const s3Client = new S3Client({ region });

export async function uploadToS3(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
  return s3Client.send(command);
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(command);
} 