import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

const CustomZodValidationPipe: typeof ZodValidationPipe = createZodValidationPipe({
  // provide custom validation exception factory
  createValidationException: (error: ZodError) =>
    new UnprocessableEntityException(
      error.issues.map((issue) => ({
        field: issue.path.join('.'),
        error: issue.message,
      })),
    ),
});

export default CustomZodValidationPipe;
