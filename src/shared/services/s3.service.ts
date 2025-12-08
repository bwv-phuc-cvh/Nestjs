import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import envConfig from '../config';
import fs from 'fs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';

@Injectable()
export class S3Service {
  private s3Client: S3;

  constructor() {
    this.s3Client = new S3({
      region: envConfig.S3_REGION,
      credentials: {
        secretAccessKey: envConfig.S3_SECRET_KEY,
        accessKeyId: envConfig.S3_ACCESS_KEY,
      },
    });
  }

  async uploadFile({ contentType, fileName, filePath }: { fileName: string; filePath: string; contentType: string }) {
    const parallelUploads3 = new Upload({
      client: this.s3Client,
      params: {
        Bucket: envConfig.S3_BUCKET_NAME,
        Key: fileName,
        Body: fs.readFileSync(filePath),
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
    });

    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(progress);
    });

    return parallelUploads3.done();
  }

  async createPresignedUrlWithClient(fileName: string) {
    const contentType = mime.lookup(fileName) || 'application/octet-stream';

    const command = new PutObjectCommand({ Bucket: envConfig.S3_BUCKET_NAME, Key: fileName, ContentType: contentType });
    return getSignedUrl(this.s3Client, command, { expiresIn: 10 }); //10s
  }
}
