import { VerificationCodeType } from 'generated/prisma';
import { User } from 'src/shared/models/user.model';
import z from 'zod';

// model schema

export const VerificationCodeSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.enum(VerificationCodeType),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
});

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

// Request schema
export const RegisterResSchema = User.omit({
  password: true,
  totpSecret: true,
});

export const RegisterBodySchema = User.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const ForgotPasswordBodySchema = User.pick({
  email: true,
  password: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const LoginBodySchema = User.pick({
  email: true,
  password: true,
})
  .extend({
    code: z.string().length(6),
    totpCode: z.string(),
  })
  .strict();

export const LoginResSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .strict();

export const SendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict();

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict();

export const LogoutBodySchema = RefreshTokenBodySchema.strict();

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
});
export const GoogleAuthUrlSchema = z.object({
  url: z.string().url(),
});

export const TwoFactorSetupResSchema = z.object({
  secret: z.string(),
  uri: z.string(),
});

export const DisableTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict();

// Type Schema
export type VerificationType = z.infer<typeof VerificationCodeSchema>;
export type DeviceType = z.infer<typeof DeviceSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>;

// Type Body
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type LogoutBodyType = z.infer<typeof LogoutBodySchema>;
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;
export type DisableTwoFactorBodyType = z.infer<typeof DisableTwoFactorBodySchema>;

// Type Response
export type RegisterResType = z.infer<typeof RegisterResSchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type GoogleAuthUrlType = z.infer<typeof GoogleAuthUrlSchema>;
