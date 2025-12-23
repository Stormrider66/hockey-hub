// @ts-nocheck - S3 service with complex AWS types
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import crypto from 'crypto';

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export interface UploadOptions {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  serverSideEncryption?: string;
}

export interface SignedUrlOptions {
  bucket: string;
  key: string;
  expiresIn?: number;
  responseContentDisposition?: string;
  responseContentType?: string;
}

export class S3Service {
  private client: S3Client;
  private defaultBucket: string;

  constructor(config: S3Config, defaultBucket: string) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
    });
    this.defaultBucket = defaultBucket;
  }

  async upload(options: UploadOptions): Promise<{ key: string; etag: string; versionId?: string }> {
    const command = new PutObjectCommand({
      Bucket: options.bucket || this.defaultBucket,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      Metadata: options.metadata,
      Tagging: options.tags ? this.formatTags(options.tags) : undefined,
      ServerSideEncryption: options.serverSideEncryption as any,
    });

    const response = await this.client.send(command);
    
    return {
      key: options.key,
      etag: response.ETag?.replace(/"/g, '') || '',
      versionId: response.VersionId,
    };
  }

  async download(bucket: string, key: string): Promise<{
    body: Readable;
    contentType?: string;
    contentLength?: number;
    metadata?: Record<string, string>;
  }> {
    const command = new GetObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key,
    });

    const response = await this.client.send(command);

    return {
      body: response.Body as Readable,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      metadata: response.Metadata,
    };
  }

  async delete(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async copy(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const command = new CopyObjectCommand({
      CopySource: `${sourceBucket}/${sourceKey}`,
      Bucket: destinationBucket || this.defaultBucket,
      Key: destinationKey,
      Metadata: metadata,
      MetadataDirective: metadata ? 'REPLACE' : 'COPY',
    });

    await this.client.send(command);
  }

  async getSignedUploadUrl(options: SignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: options.bucket || this.defaultBucket,
      Key: options.key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  async getSignedDownloadUrl(options: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: options.bucket || this.defaultBucket,
      Key: options.key,
      ResponseContentDisposition: options.responseContentDisposition,
      ResponseContentType: options.responseContentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  async listObjects(
    bucket: string,
    prefix?: string,
    maxKeys?: number
  ): Promise<{
    objects: Array<{ key: string; size: number; lastModified: Date }>;
    isTruncated: boolean;
    nextContinuationToken?: string;
  }> {
    const command = new ListObjectsV2Command({
      Bucket: bucket || this.defaultBucket,
      Prefix: prefix,
      MaxKeys: maxKeys || 1000,
    });

    const response = await this.client.send(command);

    return {
      objects:
        response.Contents?.map((obj) => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified!,
        })) || [],
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
    };
  }

  generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = filename.split('.').pop();
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();

    return `${prefix}/${timestamp}-${random}-${sanitizedFilename}`;
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}