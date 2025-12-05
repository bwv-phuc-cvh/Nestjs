import { UserStatus } from 'generated/prisma';
import z from 'zod';
import { PermissionSchema } from './permission.model';
import { RoleSchema } from './role.model';

export const User = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  phoneNumber: z.string().min(10).max(15),
  avatar: z.string().nullable(),
  totpSecret: z.string().nullable(),
  status: z.enum(UserStatus),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserType = z.infer<typeof User>;

const PermissionResSchema = PermissionSchema.pick({
  id: true,
  name: true,
  module: true,
  path: true,
  method: true,
});

const RoleResSchema = RoleSchema.pick({
  id: true,
  name: true,
}).extend({
  permissions: z.array(PermissionResSchema),
});

export const ProfileResponseSchema = User.omit({
  password: true,
  totpSecret: true,
}).extend({
  role: RoleResSchema,
});

export const UpdateProfileResSchema = User.omit({
  password: true,
  totpSecret: true,
});

export type GetUserProfileResType = z.infer<typeof ProfileResponseSchema>;
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>;
