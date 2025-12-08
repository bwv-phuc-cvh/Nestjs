import { Injectable } from '@nestjs/common';
import { unlink } from 'fs';
import { generateRandomFilename } from 'src/shared/helpers';
import { S3Service } from 'src/shared/services/s3.service';
import { PresignedUploadFileBodyDTO } from './media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFiles(files: Express.Multer.File[]) {
    const uploadedFiles = await Promise.all(
      files.map((file) =>
        this.s3Service.uploadFile({
          fileName: `images/${file.filename}`,
          filePath: file.path,
          contentType: file.mimetype,
        }),
      ),
    );

    await Promise.all(
      files.map((file) =>
        unlink(file.path, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          }
        }),
      ),
    );

    return uploadedFiles.map((file) => ({
      url: file.Location,
    }));
  }

  async getPresignedUrl(body: PresignedUploadFileBodyDTO) {
    const ramdomFilename = generateRandomFilename(body.fileName);
    const presignedUrl = await this.s3Service.createPresignedUrlWithClient(ramdomFilename);

    return {
      presignedUrl,
      url: presignedUrl.split('?')[0],
    };
  }
}
