import { PermissionSchema } from 'src/shared/models/permission.model';
import { RoleSchema } from 'src/shared/models/role.model';
import { User } from 'src/shared/models/user.model';
import z from 'zod';

export const ProfileBodySchema = User.pick({
  name: true,
  phoneNumber: true,
  avatar: true,
}).strict();

export const ProfileChangePasswordBodySchema = User.pick({
  password: true,
})
  .extend({
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .strict()
  .superRefine(({ confirmPassword, newPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

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

export type ProfileBodyType = z.infer<typeof ProfileBodySchema>;
export type ProfileChangePasswordBodyType = z.infer<typeof ProfileChangePasswordBodySchema>;
export type ProfileResponseType = z.infer<typeof ProfileResponseSchema>;
