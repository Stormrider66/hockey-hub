"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromS3 = exports.getDownloadUrl = exports.uploadToS3 = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const bucket = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
exports.s3Client = new client_s3_1.S3Client({ region });
function uploadToS3(key, body, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
        return exports.s3Client.send(command);
    });
}
exports.uploadToS3 = uploadToS3;
function getDownloadUrl(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.GetObjectCommand({ Bucket: bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn: 3600 });
    });
}
exports.getDownloadUrl = getDownloadUrl;
function deleteFromS3(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key });
        return exports.s3Client.send(command);
    });
}
exports.deleteFromS3 = deleteFromS3;
