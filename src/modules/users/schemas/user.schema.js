import { z } from 'zod';

export const assignRoleSchema = z.object({
  body: z.object({
    roleId: z
      .string()
      .min(1, 'Role ID is required'),
  }),
});

export const grantPermissionSchema = z.object({
  body: z.object({
    permissionId: z
      .string()
      .min(1, 'Permission ID is required'),
  }),
});
