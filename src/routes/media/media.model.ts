import z from 'zod';

export const PresignedUploadFileBodySchema = z
  .object({
    fileName: z.string(),
    fileSize: z.number().max(5 * 1024 * 1024), // 5MB
  })
  .strict();

export const UploadFilesResSchema = z.array(
  z.object({
    url: z.string().optional(),
  }),
);

export const PresignedUploadFileResSchema = z
  .object({
    presignedUrl: z.string(),
    url: z.string(),
  })
  .strict();

export type PresignedUploadFileBody = z.infer<typeof PresignedUploadFileBodySchema>;
export type UploadFilesRes = z.infer<typeof UploadFilesResSchema>;
export type PresignedUploadFileRes = z.infer<typeof PresignedUploadFileResSchema>;
