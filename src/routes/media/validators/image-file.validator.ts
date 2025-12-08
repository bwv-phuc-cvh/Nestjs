import { FileValidator } from '@nestjs/common';

export class ImageFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    return allowedMimes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `File must be an image (jpeg, png, or gif)`;
  }
}
