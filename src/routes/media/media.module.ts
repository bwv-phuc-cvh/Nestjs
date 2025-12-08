import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { generateRandomFilename } from 'src/shared/helpers';

const UPLOAD_DIR = path.resolve('upload');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const newFilename = generateRandomFilename(file.originalname);
    cb(null, newFilename);
  },
});

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
})
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }
}
