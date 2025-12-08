import { createZodDto } from 'nestjs-zod';
import { PresignedUploadFileBodySchema, PresignedUploadFileResSchema, UploadFilesResSchema } from './media.model';

export class FilesUploadResDTO extends createZodDto(UploadFilesResSchema) {}
export class PresignedUploadFileResDTO extends createZodDto(PresignedUploadFileResSchema) {}
export class PresignedUploadFileBodyDTO extends createZodDto(PresignedUploadFileBodySchema) {}
