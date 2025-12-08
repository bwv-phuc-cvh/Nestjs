import { Injectable, ParseFilePipe } from '@nestjs/common';
import { unlink } from 'fs/promises';
import type { ParseFileOptions } from '@nestjs/common';

@Injectable()
export class ParseFilePipeWithUnlink extends ParseFilePipe {
  constructor(options?: ParseFileOptions) {
    super(options);
  }

  async transform(value: any): Promise<any> {
    try {
      return await super.transform(value);
    } catch (error) {
      console.log('❌ Validation Failed. Cleaning up files...');

      const files: Express.Multer.File[] = Array.isArray(value) ? value : [value];

      await Promise.allSettled(
        files.map(async (file) => {
          if (file && file.path) {
            try {
              await unlink(file.path);
              console.log(`🗑️ Deleted: ${file.path}`);
            } catch (unlinkError) {
              console.error(`⚠️ Failed to delete ${file.path}`, unlinkError);
            }
          }
        }),
      );

      throw error;
    }
  }
}
