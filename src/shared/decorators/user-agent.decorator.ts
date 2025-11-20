import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator((field: string | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const userAgent: string = request.headers['user-agent'] || '';
  return field ? userAgent : userAgent;
});
