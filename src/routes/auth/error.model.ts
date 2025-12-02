import { BadRequestException } from '@nestjs/common';

export const InvalidOTPException = new BadRequestException({
  field: 'code',
  message: 'Invalid OTP code',
});

export const ExpiredOTPException = new BadRequestException({
  field: 'expiresAt',
  message: 'OTP code has expired',
});

export const EmailAlreadyRegisteredException = new BadRequestException({
  field: 'email',
  message: 'Email is already registered',
});

export const InvalidEmailException = new BadRequestException({
  field: 'email',
  message: 'Email not found',
});

export const InvalidPasswordException = new BadRequestException({
  field: 'password',
  message: 'Incorrect password',
});

export const RefreshTokenNotFoundException = new BadRequestException({
  field: 'refreshToken',
  message: 'Refresh token not found',
});

export const RefreshTokenHasBeenRevokedException = new BadRequestException({
  field: 'refreshToken',
  message: 'Refresh token has been revoked',
});

export const OTPSendFailedException = new BadRequestException({
  field: 'code',
  message: 'Failed to send OTP code, please try again later',
});

export const InvalidGoogleTokenException = new BadRequestException({
  field: 'googleToken',
  message: 'Invalid Google token',
});

export const TOTPAlreadyEnableException = new BadRequestException({
  field: 'totpCode',
  message: '2FA is enabled',
});

export const TOTPNotEnableException = new BadRequestException({
  field: 'totpCode',
  message: '2FA is not enabled',
});

export const InvalidTOTPAndCodeException = new BadRequestException({
  field: 'totpCode',
  message: 'Invalid 2FA and OTP code',
});

export const InvalidTOTPException = new BadRequestException({
  field: 'totpCode',
  message: 'Invalid TOTP code',
});
