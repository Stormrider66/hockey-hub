/// <reference types="node" />
/// <reference types="node" />
import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare function uploadToS3(key: string, body: Buffer, contentType: string): Promise<import("@aws-sdk/client-s3").PutObjectCommandOutput>;
export declare function getDownloadUrl(key: string): Promise<string>;
export declare function deleteFromS3(key: string): Promise<import("@aws-sdk/client-s3").DeleteObjectCommandOutput>;
//# sourceMappingURL=s3.d.ts.map