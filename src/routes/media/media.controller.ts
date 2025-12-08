import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  MaxFileSizeValidator,
  UploadedFiles,
  Res,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageFileValidator } from './validators/image-file.validator';
import type { Response } from 'express';
import path from 'path';
import { UPLOAD_DIR } from 'src/shared/constants/orther.constant';
import { ParseFilePipeWithUnlink } from './validators/parse-file-pipe-with-unlink.pipe';
import { ZodResponse } from 'nestjs-zod';
import { FilesUploadResDTO, PresignedUploadFileBodyDTO, PresignedUploadFileResDTO } from './media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // multiple file upload
  @Post('images/upload')
  @ZodResponse({ type: FilesUploadResDTO })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipeWithUnlink({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new ImageFileValidator(),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const results = await this.mediaService.uploadFiles(files);

    return results;
  }

  @Get('static/:filename')
  serverFile(@Param('filename') fileName: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, fileName), (error) => {
      if (error) {
        const notfound = new NotFoundException('File not found');

        res.status(notfound.getStatus()).json(notfound.getResponse());
      }
    });
  }

  @Post('images/upload/presigned-url')
  @ZodResponse({ type: PresignedUploadFileResDTO })
  async getPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignedUrl(body);
  }
}
